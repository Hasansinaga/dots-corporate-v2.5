import Geolocation from '@react-native-community/geolocation';
import {
  PermissionsAndroid,
  Platform,
  NativeModules,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './APIManager';

let ACTIVE_TENANT: string | null = null;
let BG_TIMER_ID: ReturnType<typeof setInterval> | null = null;
let WATCH_ID: number | null = null;
let isLocationTracking = false;

const TRACKING_FLAG_KEY = 'trackingActive';
const HEARTBEAT_MS = 60_000;

Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'auto',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

export function setActiveTenant(ljk: string | number | null | undefined) {
  ACTIVE_TENANT = ljk != null ? String(ljk) : null;
  if (ACTIVE_TENANT) {
    API.defaults.headers.common['X-Tenant-Id'] = ACTIVE_TENANT;
  } else {
    delete API.defaults.headers.common['X-Tenant-Id'];
  }
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn(`[tracking-safe] ${label}:`, e);
    return fallback;
  }
}

async function resolveTenantId(override?: string): Promise<string | null> {
  if (override && String(override).trim()) return String(override);
  if (ACTIVE_TENANT && ACTIVE_TENANT.trim()) return ACTIVE_TENANT;

  try {
    const fromDefaults =
      API.defaults.headers.common?.['X-Tenant-Id'] ??
      API.defaults.headers.common?.['x-tenant-id'];
    if (typeof fromDefaults === 'string' && fromDefaults.trim())
      return fromDefaults;
  } catch {}

  try {
    const fromStorage = await AsyncStorage.getItem('kodeKantor');
    if (fromStorage && fromStorage.trim()) return fromStorage;
  } catch {}

  console.warn('[tracking] Tenant ID tidak ditemukan.');
  return null;
}

async function getAuthHeaders(overrideLjk?: string) {
  let token = await AsyncStorage.getItem('authToken');
  const ljk = await resolveTenantId(overrideLjk);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (ljk) headers['X-Tenant-Id'] = ljk;

  if (token) {
    if (!/^Bearer\s+/i.test(token)) token = `Bearer ${token}`;
    headers.Authorization = token;
  }

  console.log(
    '[tracking] auth hdr -> tenant:',
    ljk,
    '| tokenLen:',
    token ? token.length : 0,
  );
  return headers;
}

function geolocationAvailable(): boolean {
  try {
    return !!Geolocation;
  } catch {
    return false;
  }
}

// Updated permission handling according to documentation
async function ensurePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // For iOS, request authorization using the documented method
    return new Promise<boolean>((resolve) => {
      Geolocation.requestAuthorization(
        () => {
          console.log('[tracking] iOS location authorization granted');
          resolve(true);
        },
        (error) => {
          console.warn('[tracking] iOS location authorization failed:', error);
          resolve(false);
        }
      );
    });
  }

  return safeAsync(
    async () => {
      try {
        const FINE_LOCATION = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
        const COARSE_LOCATION = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

        // Check if we already have fine location permission
        const hasFine = await PermissionsAndroid.check(FINE_LOCATION);

        if (!hasFine) {
          console.log('[tracking] Requesting FINE location permission...');
          const fineGranted = await PermissionsAndroid.request(
            FINE_LOCATION,
            {
              title: 'Izin Lokasi Diperlukan',
              message: 'Aplikasi memerlukan akses lokasi untuk tracking.',
              buttonPositive: 'OK',
              buttonNegative: 'Batal',
            },
          );

          if (fineGranted !== PermissionsAndroid.RESULTS.GRANTED) {
            // Try coarse location as fallback
            console.log('[tracking] Fine location denied, trying coarse location...');
            const coarseGranted = await PermissionsAndroid.request(
              COARSE_LOCATION,
              {
                title: 'Izin Lokasi Diperlukan',
                message: 'Aplikasi memerlukan akses lokasi untuk tracking.',
                buttonPositive: 'OK',
                buttonNegative: 'Batal',
              },
            );

            if (coarseGranted !== PermissionsAndroid.RESULTS.GRANTED) {
              console.warn('[tracking] Both fine and coarse location permissions denied');
              return false;
            }
          }
        }

        // Handle background location for Android API >= 29
        const androidVersion = Platform.Version;
        if (typeof androidVersion === 'number' && androidVersion >= 29) {
          try {
            const BACKGROUND_LOCATION = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
            const hasBackground = await PermissionsAndroid.check(BACKGROUND_LOCATION);
            
            if (!hasBackground) {
              console.log('[tracking] Requesting BACKGROUND location permission...');
              const backgroundGranted = await PermissionsAndroid.request(BACKGROUND_LOCATION, {
                title: 'Izin Lokasi Background',
                message: 'Untuk tracking yang akurat, aplikasi memerlukan akses lokasi di background.',
                buttonPositive: 'OK',
                buttonNegative: 'Nanti',
              });

              if (backgroundGranted !== PermissionsAndroid.RESULTS.GRANTED) {
                console.warn('[tracking] Background location permission denied - continuing with foreground only');
              }
            }
          } catch (bgError) {
            console.warn('[tracking] Background permission request failed, continuing:', bgError);
          }
        }

        return true;
      } catch (error) {
        console.error('[tracking] Permission request failed:', error);
        return false;
      }
    },
    false,
    'ensurePermission',
  );
}

async function ensureHighAccuracyEnabled(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  return safeAsync(
    async () => {
      try {
        const mod = require('react-native-android-location-enabler');
        type Enabler = {
          promptForEnableLocationIfNeeded: (opts: {
            interval: number;
            fastInterval: number;
          }) => Promise<'enabled' | 'already-enabled'>;
        };
        const RNAndroidLocationEnabler: Enabler = (mod?.default ?? mod) as Enabler;

        if (!RNAndroidLocationEnabler?.promptForEnableLocationIfNeeded) {
          console.warn('[tracking] Location enabler not available, skipping');
          return true;
        }

        const res = await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
          interval: 10_000,
          fastInterval: 5_000,
        });

        const success = res === 'enabled' || res === 'already-enabled';
        console.log('[tracking] High accuracy enabled:', success);
        return success;
      } catch (error) {
        console.warn('[tracking] Location enabler error, continuing anyway:', error);
        return true;
      }
    },
    true,
    'ensureHighAccuracyEnabled',
  );
}

// Updated GPS check according to documentation
function checkGpsAvailable(): Promise<boolean> {
  if (!geolocationAvailable()) return Promise.resolve(false);

  return new Promise(resolve => {
    let resolved = false;

    const cleanup = (result: boolean, reason: string) => {
      if (!resolved) {
        resolved = true;
        console.log(`[tracking] GPS check result: ${result} (${reason})`);
        resolve(result);
      }
    };

    const timeout = setTimeout(() => {
      cleanup(false, 'timeout after 3s');
    }, 3000);

    try {
      Geolocation.getCurrentPosition(
        position => {
          clearTimeout(timeout);
          cleanup(true, `success - lat: ${position.coords.latitude.toFixed(4)}`);
        },
        error => {
          clearTimeout(timeout);
          const errorMsg = `code: ${error?.code}, msg: ${error?.message}`;
          cleanup(false, `error - ${errorMsg}`);
        },
        {
          enableHighAccuracy: false,
          timeout: 2500,
          maximumAge: 5000,
        },
      );
    } catch (e) {
      clearTimeout(timeout);
      cleanup(false, `exception: ${e}`);
    }
  });
}

export async function ensureLocationReady(): Promise<boolean> {
  try {
    console.log('[tracking] === CHECKING LOCATION READINESS ===');

    if (!geolocationAvailable()) {
      console.error('[tracking] Geolocation service not available');
      return false;
    }

    console.log('[tracking] Step 1: Checking permissions...');
    const permitted = await ensurePermission();
    if (!permitted) {
      console.warn('[tracking] Permission not granted');
      return false;
    }
    console.log('[tracking] ✅ Permissions OK');

    if (Platform.OS === 'android') {
      console.log('[tracking] Step 2: Checking high accuracy...');
      const hiAcc = await ensureHighAccuracyEnabled();
      console.log('[tracking] High accuracy result:', hiAcc);
    }

    console.log('[tracking] Step 3: Testing GPS availability...');
    let gpsReady = false;

    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`[tracking] GPS test attempt ${attempt}/2`);
      gpsReady = await checkGpsAvailable();

      if (gpsReady) {
        console.log('[tracking] ✅ GPS test passed');
        break;
      }

      if (attempt < 2) {
        console.log('[tracking] GPS test failed, waiting 1s before retry...');
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!gpsReady) {
      console.warn('[tracking] ❌ GPS not available after retries');
      return false;
    }

    console.log('[tracking] === LOCATION READINESS CHECK COMPLETE ===');
    return true;
  } catch (e) {
    console.error('[tracking] CRITICAL ERROR in ensureLocationReady:', e);
    return false;
  }
}

interface CompanyConfigResponse {
  ljk_code: string;
  code: string;
  numvalue1: number;
  numvalue2?: number;
  textvalue1?: string;
  textvalue2?: string;
  description?: string;
  stsbar?: number;
  decval1?: number;
  decval2?: number;
  session_code?: string | null;
}

export async function isLocationTrackingEnabled(overrideLjk?: string): Promise<boolean> {
  return safeAsync(
    async () => {
      const ljk = await resolveTenantId(overrideLjk);
      if (!ljk) {
        console.warn('[tracking] No tenant ID found, location tracking disabled');
        return false;
      }

      const url = '/core/company-cfgsys';
      const params = { ljk_code: ljk, code: 'MBCORP_LOCATION_TRACK' };
      console.log('[tracking] Checking location tracking config for tenant:', ljk);

      const tryRequest = async (attempt: string): Promise<boolean> => {
        const headers = await getAuthHeaders(ljk);
        console.log(`[tracking] ${attempt} - GET ${url}`, params);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const { data } = await API.get(url, {
            params,
            headers,
            timeout: 10000,
          });

          clearTimeout(timeoutId);
          console.log('[tracking] Full API response:', JSON.stringify(data, null, 2));

          let configItem: CompanyConfigResponse | null = null;

          if (Array.isArray(data)) {
            console.log(`[tracking] Response is array with ${data.length} items`);

            if (data.length === 0) {
              console.warn('[tracking] Empty array - MBCORP_LOCATION_TRACK config not found');
              return false;
            }

            configItem =
              data.find(
                (item: CompanyConfigResponse) =>
                  item &&
                  item.code === 'MBCORP_LOCATION_TRACK' &&
                  item.ljk_code === ljk,
              ) || null;

            if (!configItem) {
              configItem =
                data.find(
                  (item: CompanyConfigResponse) =>
                    item && item.code === 'MBCORP_LOCATION_TRACK',
                ) || null;
            }
          } else if (data && typeof data === 'object') {
            if (data.code === 'MBCORP_LOCATION_TRACK') {
              configItem = data;
            }
          }

          if (!configItem) {
            console.warn('[tracking] MBCORP_LOCATION_TRACK config not found');
            return false;
          }

          if (typeof configItem.numvalue1 !== 'number') {
            console.warn('[tracking] Invalid config - numvalue1 is not a number:', configItem.numvalue1);
            return false;
          }

          const isEnabled = configItem.numvalue1 === 1;

          console.log('[tracking] Config found:', {
            code: configItem.code,
            ljk_code: configItem.ljk_code,
            numvalue1: configItem.numvalue1,
            enabled: isEnabled,
          });

          return isEnabled;
        } finally {
          clearTimeout(timeoutId);
        }
      };

      try {
        return await tryRequest('attempt-1');
      } catch (error: any) {
        const status = error?.response?.status;
        console.warn('[tracking] API request failed:', {
          status,
          message: error?.message,
        });

        if (status === 401) {
          console.log('[tracking] Retrying after 401...');
          await new Promise(r => setTimeout(r, 500));
          try {
            return await tryRequest('retry-2');
          } catch (retryError: any) {
            console.error('[tracking] Retry failed:', retryError?.message);
            return false;
          }
        }

        return false;
      }
    },
    false,
    'isLocationTrackingEnabled',
  );
}

// Updated location retrieval according to documentation
async function getLocationOnceSafe(): Promise<{
  lat: number;
  lng: number;
  accuracy?: number;
} | null> {
  if (!geolocationAvailable()) return null;

  return new Promise(resolve => {
    let resolved = false;

    const cleanup = (result: { lat: number; lng: number; accuracy?: number } | null) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const timeout = setTimeout(() => {
      cleanup(null);
    }, 8000);

    try {
      Geolocation.getCurrentPosition(
        position => {
          clearTimeout(timeout);
          cleanup({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        error => {
          clearTimeout(timeout);
          console.warn('[tracking] getLocationOnceSafe error:', {
            code: error?.code,
            message: error?.message,
          });
          cleanup(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 10000,
        },
      );
    } catch (error) {
      clearTimeout(timeout);
      console.warn('[tracking] getLocationOnceSafe threw:', error);
      cleanup(null);
    }
  });
}

async function postLocationHeartbeat(overrideLjk?: string, desc = 'Heartbeat'): Promise<boolean> {
  try {
    const ljk = await resolveTenantId(overrideLjk);
    if (!ljk) {
      console.warn('[tracking] No tenant ID for heartbeat');
      return false;
    }

    const location = await getLocationOnceSafe();
    if (!location) {
      console.warn('[tracking] No location available for heartbeat');
      return false;
    }

    const headers = await getAuthHeaders(ljk);
    const heartbeatData = {
      latitude: location.lat,
      longitude: location.lng,
      desc,
      timestamp: new Date().toISOString(),
      accuracy: location.accuracy,
    };

    const response = await Promise.race([
      API.post('/mobile-corporate/user-locations', heartbeatData, { headers }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000),
      ),
    ]);

    console.log(`[tracking] Heartbeat sent: ${desc}`);
    return true;
  } catch (error: any) {
    console.warn('[tracking] Heartbeat failed:', {
      status: error?.response?.status,
      message: error?.message,
      desc,
    });
    return false;
  }
}

// Updated background tracking with watchPosition
export async function startBackgroundTrackingIfEnabled(overrideLjk?: string): Promise<boolean> {
  try {
    console.log('[tracking] === STARTING BACKGROUND TRACKING ===');

    if (isLocationTracking) {
      console.log('[tracking] Background tracking already in progress');
      return true;
    }

    if (!geolocationAvailable()) {
      console.error('[tracking] Geolocation not available for background tracking');
      return false;
    }

    const ljk = await resolveTenantId(overrideLjk);
    if (!ljk) {
      console.log('[tracking] No tenant ID, background tracking disabled');
      return false;
    }

    const enabled = await isLocationTrackingEnabled(ljk);
    if (!enabled) {
      console.log('[tracking] Location tracking disabled by server config');
      return false;
    }

    const ready = await ensureLocationReady();
    if (!ready) {
      console.warn('[tracking] Location services not ready');
      return false;
    }

    isLocationTracking = true;

    // Try native foreground service for Android
    if (Platform.OS === 'android') {
      const intentLauncher = getIntentLauncher();
      if (intentLauncher?.startLocationService) {
        try {
          await intentLauncher.startLocationService();
          console.log('[tracking] Native foreground service started');
          await AsyncStorage.setItem(TRACKING_FLAG_KEY, '1');

          setTimeout(() => {
            postLocationHeartbeat(ljk, 'BackgroundStart').catch(() => {});
          }, 2000);

          return true;
        } catch (error) {
          console.warn('[tracking] Native service failed, using watchPosition:', error);
        }
      }
    }

    // Use watchPosition for continuous tracking as per documentation
    try {
      WATCH_ID = Geolocation.watchPosition(
        position => {
          console.log('[tracking] Watch position update received');
          // Send heartbeat with current location
          const heartbeatData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            desc: 'WatchPosition',
            timestamp: new Date().toISOString(),
            accuracy: position.coords.accuracy,
          };

          // Send heartbeat asynchronously
          (async () => {
            try {
              const headers = await getAuthHeaders(ljk);
              await API.post('/mobile-corporate/user-locations', heartbeatData, { headers });
              console.log('[tracking] Watch position heartbeat sent');
            } catch (error) {
              console.warn('[tracking] Watch position heartbeat failed:', error);
            }
          })();
        },
        error => {
          console.warn('[tracking] Watch position error:', {
            code: error?.code,
            message: error?.message,
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
          distanceFilter: 10, // Only update when moved 10 meters
          interval: HEARTBEAT_MS, // Android only
          fastestInterval: HEARTBEAT_MS / 2, // Android only
          useSignificantChanges: false, // Use continuous tracking
        },
      );

      console.log('[tracking] Watch position started with ID:', WATCH_ID);
    } catch (watchError) {
      console.warn('[tracking] watchPosition failed, falling back to timer:', watchError);
    }

    // Fallback timer-based tracking
    if (BG_TIMER_ID != null) {
      clearInterval(BG_TIMER_ID);
    }

    setTimeout(() => {
      postLocationHeartbeat(ljk, 'BackgroundStart').catch(() => {});
    }, 3000);

    BG_TIMER_ID = setInterval(() => {
      try {
        const appState = AppState.currentState;
        console.log(`[tracking] Heartbeat tick - AppState: ${appState}`);

        if (appState === 'active' || appState === 'background') {
          postLocationHeartbeat(ljk, `Periodic-${appState}`).catch(error => {
            console.warn('[tracking] Heartbeat error in interval:', error?.message);
          });
        }
      } catch (intervalError) {
        console.error('[tracking] Error in heartbeat interval:', intervalError);
      }
    }, HEARTBEAT_MS);

    await AsyncStorage.setItem(TRACKING_FLAG_KEY, '1');
    console.log('[tracking] Background tracking started (hybrid mode)');
    console.log('[tracking] === BACKGROUND TRACKING ACTIVE ===');
    return true;
  } catch (error) {
    console.error('[tracking] CRITICAL ERROR in startBackgroundTrackingIfEnabled:', error);
    isLocationTracking = false;
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  console.log('[tracking] === STOPPING BACKGROUND TRACKING ===');

  isLocationTracking = false;

  // Stop watchPosition if active
  if (WATCH_ID !== null) {
    try {
      Geolocation.clearWatch(WATCH_ID);
      console.log('[tracking] Watch position cleared:', WATCH_ID);
      WATCH_ID = null;
    } catch (error) {
      console.warn('[tracking] Failed to clear watch position:', error);
    }
  }

  // Stop native service
  if (Platform.OS === 'android') {
    const intentLauncher = getIntentLauncher();
    if (intentLauncher?.stopLocationService) {
      try {
        await intentLauncher.stopLocationService();
        console.log('[tracking] Native service stopped');
      } catch (error) {
        console.warn('[tracking] Native service stop failed:', error);
      }
    }
  }

  // Stop timer-based tracking
  if (BG_TIMER_ID != null) {
    clearInterval(BG_TIMER_ID);
    BG_TIMER_ID = null;
    console.log('[tracking] JS background timer stopped');
  }

  // Stop observing (cleanup method from documentation)
  try {
    Geolocation.stopObserving();
    console.log('[tracking] Geolocation observing stopped');
  } catch (error) {
    console.warn('[tracking] Failed to stop observing:', error);
  }

  try {
    await AsyncStorage.setItem(TRACKING_FLAG_KEY, '0');
  } catch (storageError) {
    console.warn('[tracking] Failed to update storage flag:', storageError);
  }

  console.log('[tracking] === BACKGROUND TRACKING STOPPED ===');
}

export async function sendLoginLocationOnce(overrideLjk?: string): Promise<boolean> {
  if (!geolocationAvailable()) {
    console.warn('[tracking] Geolocation not available for login location');
    return false;
  }

  return new Promise(resolve => {
    let resolved = false;

    const cleanup = (result: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const timeout = setTimeout(() => {
      console.warn('[tracking] sendLoginLocationOnce timeout');
      cleanup(false);
    }, 8000);

    try {
      Geolocation.getCurrentPosition(
        async position => {
          clearTimeout(timeout);
          try {
            const ljk = await resolveTenantId(overrideLjk);
            if (!ljk) {
              console.warn('[tracking] No tenant ID for login location');
              return cleanup(false);
            }

            const headers = await getAuthHeaders(ljk);
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              desc: 'Login',
              timestamp: new Date().toISOString(),
              accuracy: position.coords.accuracy,
            };

            console.log('[tracking] Sending login location:', locationData);

            await Promise.race([
              API.post('/mobile-corporate/user-locations', locationData, { headers }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Login request timeout')), 10000),
              ),
            ]);

            console.log('[tracking] Login location sent successfully');
            cleanup(true);
          } catch (error: any) {
            console.warn('[tracking] Failed to post login location:', error?.message);
            cleanup(false);
          }
        },
        error => {
          clearTimeout(timeout);
          console.warn('[tracking] Failed to get position for login:', error?.message);
          cleanup(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 5000,
        },
      );
    } catch (error) {
      clearTimeout(timeout);
      console.error('[tracking] getCurrentPosition threw:', error);
      cleanup(false);
    }
  });
}

export async function startLoginTrackingIfEnabled(overrideLjk?: string): Promise<boolean> {
  try {
    console.log('[tracking] === STARTING LOGIN TRACKING ===');

    const enabled = await isLocationTrackingEnabled(overrideLjk);
    if (!enabled) {
      console.log('[tracking] Login tracking disabled by server config');
      return false;
    }

    const locationReady = await ensureLocationReady();
    if (!locationReady) {
      console.warn('[tracking] Location services not ready for login tracking');
      return false;
    }

    const sent = await sendLoginLocationOnce(overrideLjk);
    console.log('[tracking] === LOGIN TRACKING COMPLETED - sent:', sent, '===');
    return sent;
  } catch (error) {
    console.error('[tracking] CRITICAL ERROR in startLoginTrackingIfEnabled:', error);
    return false;
  }
}

export function startLoginTrackingSafe(overrideLjk?: string): void {
  setTimeout(() => {
    startLoginTrackingIfEnabled(overrideLjk)
      .then(success =>
        console.log('[tracking] Background login tracking completed:', success),
      )
      .catch(error =>
        console.error('[tracking] Background login tracking failed:', error),
      );
  }, 2000);
}

export async function isTrackingActive(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(TRACKING_FLAG_KEY);
    const active = flag === '1';
    console.log('[tracking] Tracking active status:', active);
    return active;
  } catch (error) {
    console.error('[tracking] Error checking tracking status:', error);
    return false;
  }
}

function getIntentLauncher() {
  try {
    return (NativeModules as any)?.IntentLauncher ?? null;
  } catch {
    return null;
  }
}

export async function testLocationTrackingAPI(overrideLjk?: string): Promise<{ 
  success: boolean; 
  config?: any; 
  error?: string 
}> {
  try {
    const ljk = await resolveTenantId(overrideLjk);
    if (!ljk) {
      return { success: false, error: 'No tenant ID available' };
    }

    const headers = await getAuthHeaders(ljk);
    const url = '/core/company-cfgsys';
    const params = { ljk_code: ljk, code: 'MBCORP_LOCATION_TRACK' };

    console.log('[tracking] Testing API connection...');
    const response = await API.get(url, { params, headers, timeout: 10000 });

    return { success: true, config: response.data };
  } catch (error: any) {
    console.error('[tracking] Test API failed:', error?.response?.status || error?.message);
    return {
      success: false,
      error: error?.response?.status || error?.message || 'Unknown error',
    };
  }
}

export default {
  setActiveTenant,
  isLocationTrackingEnabled,
  ensureLocationReady,
  sendLoginLocationOnce,
  startLoginTrackingIfEnabled,
  startLoginTrackingSafe,
  startBackgroundTrackingIfEnabled,
  stopBackgroundTracking,
  isTrackingActive,
  testLocationTrackingAPI,
};