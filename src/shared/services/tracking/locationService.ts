// locationService.ts - Location data retrieval and API calls
import Geolocation from '@react-native-community/geolocation';
import API from '../APIManager';
import { LocationResult, CompanyConfigResponse, safeAsync, geolocationAvailable, getAuthHeaders, resolveTenantId } from './trackingCore';

// Updated location retrieval according to documentation
export async function getLocationOnceSafe(): Promise<LocationResult | null> {
  if (!geolocationAvailable()) return null;

  return new Promise(resolve => {
    let resolved = false;

    const cleanup = (result: LocationResult | null) => {
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

// Get current location for testing purposes
export async function getCurrentLocationTest(): Promise<{
  success: boolean;
  location?: LocationResult;
  error?: string;
}> {
  try {
    const location = await getLocationOnceSafe();
    if (location) {
      return { success: true, location };
    } else {
      return { success: false, error: 'Unable to get location' };
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
  }
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

export async function postLocationHeartbeat(overrideLjk?: string, desc = 'Heartbeat'): Promise<boolean> {
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

// Send test heartbeat
export async function sendTestHeartbeat(overrideLjk?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const success = await postLocationHeartbeat(overrideLjk, 'TestHeartbeat');
    return { success };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unknown error' };
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