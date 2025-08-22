// locationPermissions.ts - Fixed version with proper GPS detection
import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform } from 'react-native';
import { safeAsync, geolocationAvailable } from './trackingCore';

// Cache untuk mencegah multiple checks bersamaan
let lastGpsCheck: { result: boolean; timestamp: number } | null = null;
let isCheckingGps = false;
const GPS_CACHE_DURATION = 5000; // 5 detik

// Permission handling according to documentation
export async function ensurePermission(): Promise<boolean> {
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

export async function ensureHighAccuracyEnabled(): Promise<boolean> {
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

export function checkGpsAvailable(): Promise<boolean> {
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

// FIXED: Much more robust GPS status detection
export async function checkGpsCurrently(): Promise<boolean> {
  if (!geolocationAvailable()) return false;

  // Return cached result if recent
  const now = Date.now();
  if (lastGpsCheck && (now - lastGpsCheck.timestamp) < GPS_CACHE_DURATION) {
    console.log('[tracking] Using cached GPS status:', lastGpsCheck.result);
    return lastGpsCheck.result;
  }

  // Prevent multiple simultaneous checks
  if (isCheckingGps) {
    console.log('[tracking] GPS check already in progress, waiting...');
    // Wait for existing check to complete
    let attempts = 0;
    while (isCheckingGps && attempts < 50) { // Max 5 seconds wait
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    // Return cached result if available
    if (lastGpsCheck && (Date.now() - lastGpsCheck.timestamp) < GPS_CACHE_DURATION) {
      return lastGpsCheck.result;
    }
  }

  isCheckingGps = true;

  return new Promise(resolve => {
    let resolved = false;
    let quickCheckPassed = false;

    const cleanup = (result: boolean, reason?: string) => {
      if (!resolved) {
        resolved = true;
        isCheckingGps = false;
        
        // Cache the result
        lastGpsCheck = {
          result,
          timestamp: Date.now()
        };
        
        console.log(`[tracking] GPS currently available: ${result}${reason ? ` (${reason})` : ''}`);
        resolve(result);
      }
    };

    // First try: Quick check with cached location (more lenient)
    const quickTimeout = setTimeout(() => {
      if (!quickCheckPassed) {
        console.log('[tracking] Quick GPS check timed out, trying precise check...');
        // Don't cleanup here, let the precise check run
      }
    }, 1500);

    try {
      Geolocation.getCurrentPosition(
        (position) => {
          quickCheckPassed = true;
          clearTimeout(quickTimeout);
          if (!resolved) {
            cleanup(true, 'quick check success');
          }
        },
        (error) => {
          clearTimeout(quickTimeout);
          
          console.log(`[tracking] Quick GPS check error - code: ${error?.code}, message: ${error?.message}`);
          
          // If quick check fails, try a more precise check
          if (!resolved && !quickCheckPassed) {
            console.log('[tracking] Quick check failed, trying precise check...');
            
            const preciseTimeout = setTimeout(() => {
              cleanup(false, 'precise check timeout - GPS likely disabled');
            }, 4000);

            try {
              Geolocation.getCurrentPosition(
                (position) => {
                  clearTimeout(preciseTimeout);
                  if (!resolved) {
                    cleanup(true, 'precise check success');
                  }
                },
                (preciseError) => {
                  clearTimeout(preciseTimeout);
                  
                  console.log(`[tracking] Precise GPS check error - code: ${preciseError?.code}, message: ${preciseError?.message}`);
                  
                  // IMPROVED: More lenient error handling based on real-world behavior
                  if (preciseError?.code === 1) {
                    // Permission denied
                    cleanup(false, 'permission denied');
                  } else if (preciseError?.code === 2) {
                    // Position unavailable - could be temporary, be more lenient
                    // Check if we have Android location services enabled via settings
                    if (Platform.OS === 'android') {
                      // On Android, code 2 sometimes occurs even when GPS is on
                      // due to poor signal or slow GPS startup
                      console.log('[tracking] Position unavailable on Android - assuming GPS is enabled but having signal issues');
                      cleanup(true, 'position unavailable but likely GPS enabled (Android)');
                    } else {
                      cleanup(false, 'position unavailable - GPS likely disabled');
                    }
                  } else if (preciseError?.code === 3) {
                    // Timeout - GPS is probably on but slow
                    cleanup(true, 'timeout - GPS likely enabled but slow');
                  } else {
                    // Unknown error - on Android be more lenient, on iOS be strict
                    if (Platform.OS === 'android') {
                      cleanup(true, `unknown error but assuming GPS enabled (Android): ${preciseError?.message}`);
                    } else {
                      cleanup(false, `unknown error: ${preciseError?.message}`);
                    }
                  }
                },
                {
                  enableHighAccuracy: false, // Use less demanding accuracy for check
                  timeout: 3500,
                  maximumAge: 10000, // Allow slightly older cached positions
                },
              );
            } catch (preciseException) {
              clearTimeout(preciseTimeout);
              if (!resolved) {
                cleanup(false, `precise check exception: ${preciseException}`);
              }
            }
          }
        },
        {
          enableHighAccuracy: false, // Start with lower accuracy for faster response
          timeout: 1000,
          maximumAge: 30000, // Allow cached positions for quick check
        },
      );
    } catch (e) {
      clearTimeout(quickTimeout);
      cleanup(false, `quick check exception: ${e}`);
    }
  });
}

// FIXED: Better location readiness check with retry logic
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
      
      // Don't fail if high accuracy setup fails, continue with regular accuracy
      if (!hiAcc) {
        console.log('[tracking] High accuracy not available, continuing with normal accuracy');
      }
    }

    console.log('[tracking] Step 3: Testing GPS availability...');
    let gpsReady = false;

    // Try up to 3 times with increasing delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`[tracking] GPS test attempt ${attempt}/3`);
      
      // Clear cache before each attempt to ensure fresh check
      lastGpsCheck = null;
      
      gpsReady = await checkGpsCurrently();

      if (gpsReady) {
        console.log('[tracking] ✅ GPS test passed');
        break;
      }

      if (attempt < 3) {
        const delay = attempt * 1000; // 1s, then 2s delay
        console.log(`[tracking] GPS test failed, waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
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
    isCheckingGps = false; // Reset flag on error
    return false;
  }
}

// FIXED: Use the improved checkGpsCurrently function
export async function checkLocationServicesEnabled(): Promise<boolean> {
  try {
    if (!geolocationAvailable()) {
      console.warn('[tracking] Geolocation service not available');
      return false;
    }
    
    const gpsAvailable = await checkGpsCurrently();
    console.log('[tracking] GPS currently available:', gpsAvailable);
    
    return gpsAvailable;
  } catch (error) {
    console.error('[tracking] Error checking location services:', error);
    isCheckingGps = false; // Reset flag on error
    return false;
  }
}

// NEW: Function to clear GPS check cache (useful for manual refresh)
export function clearGpsCheckCache(): void {
  lastGpsCheck = null;
  console.log('[tracking] GPS check cache cleared');
}

// NEW: Get GPS check cache status (useful for debugging)
export function getGpsCheckCacheStatus(): { cached: boolean; age?: number; result?: boolean } {
  if (!lastGpsCheck) {
    return { cached: false };
  }
  
  const age = Date.now() - lastGpsCheck.timestamp;
  return {
    cached: true,
    age,
    result: lastGpsCheck.result
  };
}