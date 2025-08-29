// globalTrackingService.ts - Global tracking service yang berjalan di background
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isTracking,
  startTracking,
  stopTracking,
  checkTrackingEnabled,
  startLocationMonitoring,
  stopLocationMonitoring,
  getCurrentLocationStatus,
  forceLocationCheck,
} from './trackingService';

// Global state
let isGlobalTrackingInitialized = false;
let appStateSubscription: any = null;
let locationMonitoringActive = false;

// Initialize global tracking service (prepare only, don't start tracking yet)
export async function initializeGlobalTracking(tenantId: string): Promise<boolean> {
  if (isGlobalTrackingInitialized) {
    console.log('[global-tracking] Already initialized');
    return true;
  }

  try {
    console.log('[global-tracking] Preparing global tracking for tenant:', tenantId);
    
    // Check if tracking is enabled for this tenant
    const trackingEnabled = await checkTrackingEnabled(tenantId);
    if (!trackingEnabled) {
      console.log('[global-tracking] Tracking not enabled for tenant:', tenantId);
      console.log('[global-tracking] MBCORP_LOCATION_TRACK config not found or disabled (numvalue1/numvalue2 != 1)');
      isGlobalTrackingInitialized = true;
      return false;
    }

    // Setup app state monitoring (don't start tracking yet)
    setupAppStateMonitoring();
    
    console.log('[global-tracking] Global tracking prepared successfully');
    isGlobalTrackingInitialized = true;
    return true;
  } catch (error) {
    console.error('[global-tracking] Error preparing global tracking:', error);
    return false;
  }
}

// Start actual tracking (called when user is ready)
export async function startGlobalTracking(tenantId: string): Promise<boolean> {
  if (!isGlobalTrackingInitialized) {
    console.warn('[global-tracking] Not initialized, cannot start tracking');
    return false;
  }

  try {
    console.log('[global-tracking] Starting actual tracking...');
    
    // Start tracking
    const success = await startTracking(tenantId);
    if (success) {
      console.log('[global-tracking] Global tracking started successfully');
      
      // Start location monitoring for background tracking
      await startLocationMonitoring(
        {
          checkIntervalMs: 60000, // Check every 1 minute for background
          showLocationNotification: true,
          enableBackgroundUpdates: true,
        },
        async (status) => {
          // Handle location status changes
          if (!status.canGetLocation && isTracking()) {
            console.warn('[global-tracking] Location became unavailable');
            // Could trigger a global notification here
          }
        },
        async (location) => {
          // Location updates are handled by trackingService interval
          console.log('[global-tracking] Location updated:', location);
        }
      );
      
      locationMonitoringActive = true;
    }

    return success;
  } catch (error) {
    console.error('[global-tracking] Error starting global tracking:', error);
    return false;
  }
}

// Setup app state monitoring for background/foreground
function setupAppStateMonitoring() {
  if (appStateSubscription) {
    appStateSubscription.remove();
  }

  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    console.log('[global-tracking] App state changed to:', nextAppState);
    
    if (nextAppState === 'active') {
      // App became active, check if tracking is still working
      setTimeout(async () => {
        if (isTracking()) {
          console.log('[global-tracking] App active, tracking is running');
          // Force a location check
          await forceLocationCheck();
        } else {
          console.warn('[global-tracking] App active but tracking stopped, restarting...');
          // Try to restart tracking
          const tenantId = await AsyncStorage.getItem('tenantId');
          if (tenantId) {
            await startGlobalTracking(tenantId);
          }
        }
      }, 2000);
    } else if (nextAppState === 'background') {
      console.log('[global-tracking] App backgrounded, tracking continues in background');
      // Tracking continues in background - no need to stop
    }
  });
}

// Stop global tracking
export function stopGlobalTracking(): void {
  console.log('[global-tracking] Stopping global tracking');
  
  // Stop tracking
  stopTracking();
  
  // Stop location monitoring
  if (locationMonitoringActive) {
    stopLocationMonitoring();
    locationMonitoringActive = false;
  }
  
  // Remove app state subscription
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  
  isGlobalTrackingInitialized = false;
}

// Check if global tracking is active
export function isGlobalTrackingActive(): boolean {
  return isGlobalTrackingInitialized && isTracking();
}

// Get global tracking status
export async function getGlobalTrackingStatus() {
  const trackingActive = isTracking();
  const locationStatus = await getCurrentLocationStatus();
  
  return {
    trackingActive,
    locationAvailable: locationStatus.canGetLocation,
    initialized: isGlobalTrackingInitialized,
    monitoringActive: locationMonitoringActive,
  };
}

// Debug function to check tracking setup
export async function debugTrackingSetup(tenantId: string) {
  console.log('[debug] === Tracking Setup Debug ===');
  console.log('[debug] Tenant ID:', tenantId);
  console.log('[debug] Active Tenant ID:', await import('./trackingService').then(m => m.getActiveTenant()));
  console.log('[debug] Global Tracking Initialized:', isGlobalTrackingInitialized);
  console.log('[debug] Tracking Active:', isTracking());
  
  try {
    const configEnabled = await import('./trackingService').then(m => m.checkTrackingEnabled(tenantId));
    console.log('[debug] Config Enabled:', configEnabled);
  } catch (error) {
    console.error('[debug] Config Check Error:', error);
  }
  
  console.log('[debug] === End Debug ===');
}

// Restart global tracking (useful for recovery)
export async function restartGlobalTracking(): Promise<boolean> {
  console.log('[global-tracking] Restarting global tracking');
  
  const tenantId = await AsyncStorage.getItem('tenantId');
  if (!tenantId) {
    console.warn('[global-tracking] No tenant ID found for restart');
    return false;
  }
  
  stopGlobalTracking();
  const prepared = await initializeGlobalTracking(tenantId);
  if (prepared) {
    return await startGlobalTracking(tenantId);
  }
  return false;
}
