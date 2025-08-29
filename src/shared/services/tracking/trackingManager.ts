// trackingManager.ts - Background tracking and monitoring
import Geolocation from 'react-native-geolocation-service';
import { Platform, NativeModules, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../APIManager';
import { 
  TRACKING_FLAG_KEY, 
  HEARTBEAT_MS, 
  GPS_CHECK_MS,
  setLocationTrackingState,
  getLocationTrackingState,
  setTimerIds,
  getTimerIds,
  getAuthHeaders,
  resolveTenantId
} from './trackingCore';
import { checkGpsCurrently } from './locationPermissions';
import { isLocationTrackingEnabled, postLocationHeartbeat } from './locationService';

// Start GPS monitoring timer
export function startGpsMonitoring() {
  const { gpsTimer } = getTimerIds();
  
  if (gpsTimer) {
    clearInterval(gpsTimer);
  }

  const newGpsTimer = setInterval(async () => {
    try {
      const gpsAvailable = await checkGpsCurrently();
      console.log('[tracking] GPS monitor check:', gpsAvailable);
      
      if (!gpsAvailable) {
        console.warn('[tracking] GPS appears to be disabled during monitoring');
        // You can emit an event or call a callback here to notify the UI
        // For now, just log the issue
      }
    } catch (error) {
      console.warn('[tracking] GPS monitor error:', error);
    }
  }, GPS_CHECK_MS);

  setTimerIds({ gpsTimer: newGpsTimer });
  console.log('[tracking] GPS monitoring started');
}

// Stop GPS monitoring timer
export function stopGpsMonitoring() {
  const { gpsTimer } = getTimerIds();
  
  if (gpsTimer) {
    clearInterval(gpsTimer);
    setTimerIds({ gpsTimer: null });
    console.log('[tracking] GPS monitoring stopped');
  }
}

function getIntentLauncher() {
  try {
    return (NativeModules as any)?.IntentLauncher ?? null;
  } catch {
    return null;
  }
}

// Updated background tracking with watchPosition
export async function startBackgroundTrackingIfEnabled(overrideLjk?: string): Promise<boolean> {
  try {
    console.log('[tracking] === STARTING BACKGROUND TRACKING ===');

    const { isTracking } = getLocationTrackingState();
    if (isTracking) {
      console.log('[tracking] Background tracking already in progress');
      return true;
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

    // Import location readiness check
    const { ensureLocationReady } = await import('./locationPermissions');
    const ready = await ensureLocationReady();
    if (!ready) {
      console.warn('[tracking] Location services not ready');
      return false;
    }

    setLocationTrackingState(true);

    // Start GPS monitoring
    startGpsMonitoring();

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
      const watchId = Geolocation.watchPosition(
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

      setTimerIds({ watchId });
      console.log('[tracking] Watch position started with ID:', watchId);
    } catch (watchError) {
      console.warn('[tracking] watchPosition failed, falling back to timer:', watchError);
    }

    // Fallback timer-based tracking
    const { bgTimer } = getTimerIds();
    if (bgTimer != null) {
      clearInterval(bgTimer);
    }

    setTimeout(() => {
      postLocationHeartbeat(ljk, 'BackgroundStart').catch(() => {});
    }, 3000);

    const newBgTimer = setInterval(() => {
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

    setTimerIds({ bgTimer: newBgTimer });

    await AsyncStorage.setItem(TRACKING_FLAG_KEY, '1');
    console.log('[tracking] Background tracking started (hybrid mode)');
    console.log('[tracking] === BACKGROUND TRACKING ACTIVE ===');
    return true;
  } catch (error) {
    console.error('[tracking] CRITICAL ERROR in startBackgroundTrackingIfEnabled:', error);
    setLocationTrackingState(false);
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  console.log('[tracking] === STOPPING BACKGROUND TRACKING ===');

  setLocationTrackingState(false);

  // Stop GPS monitoring
  stopGpsMonitoring();

  // Stop watchPosition if active
  const { watchId } = getTimerIds();
  if (watchId !== null) {
    try {
      Geolocation.clearWatch(watchId);
      console.log('[tracking] Watch position cleared:', watchId);
      setTimerIds({ watchId: null });
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
  const { bgTimer } = getTimerIds();
  if (bgTimer != null) {
    clearInterval(bgTimer);
    setTimerIds({ bgTimer: null });
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

// Force stop all tracking components
export async function forceStopAllTracking(): Promise<void> {
  console.log('[tracking] === FORCE STOPPING ALL TRACKING ===');
  
  // Set flags
  setLocationTrackingState(false);
  
  // Stop all timers
  const { gpsTimer, bgTimer, watchId } = getTimerIds();
  
  if (gpsTimer) {
    clearInterval(gpsTimer);
  }
  
  if (bgTimer) {
    clearInterval(bgTimer);
  }
  
  if (watchId !== null) {
    try {
      Geolocation.clearWatch(watchId);
    } catch (error) {
      console.warn('[tracking] Error clearing watch:', error);
    }
  }

  setTimerIds({ gpsTimer: null, bgTimer: null, watchId: null });
  
  // Stop native services
  if (Platform.OS === 'android') {
    const intentLauncher = getIntentLauncher();
    if (intentLauncher?.stopLocationService) {
      try {
        await intentLauncher.stopLocationService();
      } catch (error) {
        console.warn('[tracking] Error stopping native service:', error);
      }
    }
  }
  
  // Stop geolocation observing
  try {
    Geolocation.stopObserving();
  } catch (error) {
    console.warn('[tracking] Error stopping geolocation observing:', error);
  }
  
  // Update storage
  try {
    await AsyncStorage.setItem(TRACKING_FLAG_KEY, '0');
  } catch (error) {
    console.warn('[tracking] Error updating storage flag:', error);
  }
  
  console.log('[tracking] === FORCE STOP COMPLETE ===');
}