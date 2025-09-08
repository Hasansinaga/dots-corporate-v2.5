// trackingService.ts - Clean tracking service untuk location tracking
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../APIManager';
import { cfgsysService } from '../cfgsysService';
import { getTenantIdWithFallback } from '../../utils/tenantUtils';
import { 
  LocationResult, 
  CompanyConfigResponse, 
  LocationHeartbeatData,
  TrackingConfig,
  LocationStatus 
} from './types';
import { 
  geolocationAvailable,
  showLocationRequiredAlert 
} from './locationPermissions';
import {
  startLocationMonitoring,
  stopLocationMonitoring,
  getCurrentLocationStatus,
  getLastKnownLocation,
  showLocationNotification
} from './locationMonitor';

// Constants
const TRACKING_INTERVAL_MS = 1 * 60 * 1000; // 1 menit
const BACKGROUND_TRACKING_INTERVAL_MS = 1 * 60 * 1000; // 1 menit untuk background
const CONFIG_KEY = 'MBCORP_LOCATION_TRACK';
const TRACKING_ACTIVE_KEY = 'trackingActive';

// Global state
let trackingInterval: NodeJS.Timeout | null = null;
let isTrackingActive = false;
let activeTenantId: string | null = null;

// Utility functions
async function getAuthHeaders(tenantId: string): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('authToken');
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId
  };

  if (token) {
    const authToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    headers['Authorization'] = authToken;
    console.log('[tracking] Auth headers set with token:', authToken.substring(0, 50) + '...');
  } else {
    console.warn('[tracking] No auth token found');
  }

  console.log('[tracking] Final headers:', headers);
  return headers;
}

async function getCurrentLocation(): Promise<LocationResult | null> {
  if (!geolocationAvailable()) {
    console.warn('[tracking] Geolocation not available');
    return null;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[tracking] Location request timeout');
      resolve(null);
    }, 8000);

    Geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        clearTimeout(timeout);
        console.warn('[tracking] Location error:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 7000,
        maximumAge: 10000,
      }
    );
  });
}

// Set active tenant for tracking
export function setActiveTenant(tenantId: string): void {
  activeTenantId = tenantId;
  console.log('[tracking] Active tenant set to:', tenantId);
}

// Get active tenant for debugging
export function getActiveTenant(): string | null {
  return activeTenantId;
}

// Check if location tracking is enabled (alias for checkTrackingEnabled)
export async function isLocationTrackingEnabled(tenantId: string): Promise<boolean> {
  return await checkTrackingEnabled(tenantId);
}

// Start login tracking if enabled
export async function startLoginTrackingIfEnabled(tenantId: string): Promise<boolean> {
  try {
    const enabled = await checkTrackingEnabled(tenantId);
    if (enabled) {
      return await startTracking(tenantId);
    }
    return false;
  } catch (error) {
    console.warn('[tracking] Error starting login tracking:', error);
    return false;
  }
}

// Start background tracking if enabled
export async function startBackgroundTrackingIfEnabled(tenantId: string): Promise<boolean> {
  try {
    const enabled = await checkTrackingEnabled(tenantId);
    if (enabled) {
      return await startTracking(tenantId);
    }
    return false;
  } catch (error) {
    console.warn('[tracking] Error starting background tracking:', error);
    return false;
  }
}

// Check apakah tracking diaktifkan dari API
export async function checkTrackingEnabled(tenantId?: string): Promise<boolean> {
  try {
    // Use provided tenantId, activeTenantId, or get from storage
    const targetTenantId = tenantId || activeTenantId || await getTenantIdWithFallback();
    console.log('[tracking] Checking tracking config for tenant:', targetTenantId);
    
    // Use cfgsysService to get configuration
    const config = await cfgsysService.getCompanyConfig(targetTenantId, CONFIG_KEY);
    
    if (config) {
      // Check if numvalue1 OR numvalue2 equals 1
      const isEnabled = config.numvalue1 === 1 || config.numvalue2 === 1;
      console.log('[tracking] Tracking config found:', {
        code: config.code,
        numvalue1: config.numvalue1,
        numvalue2: config.numvalue2,
        isEnabled: isEnabled
      });
      return isEnabled;
    } else {
      console.log('[tracking] No location tracking config found for tenant:', targetTenantId);
      return false;
    }
  } catch (error: any) {
    console.error('[tracking] Error checking tracking config:', error.message);
    return false;
  }
}

// Kirim location data ke API
export async function sendLocationData(
  tenantId: string, 
  location: LocationResult, 
  desc?: string
): Promise<boolean> {
  try {
    const headers = await getAuthHeaders(tenantId);
    
    // Determine description based on batch status
    let finalDesc = desc;
    if (!finalDesc) {
      try {
        // Try to get active batch ID from AsyncStorage
        const activeBatchId = await AsyncStorage.getItem('activeBatchId');
        if (activeBatchId) {
          finalDesc = activeBatchId;
          console.log('[tracking] Using active batch ID as desc:', activeBatchId);
        } else {
          finalDesc = 'LOGIN';
          console.log('[tracking] No active batch, using LOGIN as desc');
        }
      } catch (error) {
        finalDesc = 'LOGIN';
        console.warn('[tracking] Error getting batch ID, using LOGIN as desc:', error);
      }
    }
    
    const locationData: LocationHeartbeatData = {
      latitude: location.lat,
      longitude: location.lng,
      desc: finalDesc,
      created_at: new Date().toISOString()
    };

    console.log('[tracking] Sending location data:', locationData);

    await API.post('/mobile-corporate/user-locations', locationData, {
      headers,
      timeout: 15000
    });

    console.log('[tracking] Location data sent successfully');
    return true;
  } catch (error: any) {
    console.error('[tracking] Error sending location data:', error.message);
    return false;
  }
}

// Start tracking dengan location monitoring
export async function startTracking(tenantId: string): Promise<boolean> {
  try {
    // First check if tracking is enabled
    const trackingEnabled = await checkTrackingEnabled(tenantId);
    if (!trackingEnabled) {
      console.log('[tracking] Cannot start tracking - not enabled for tenant:', tenantId);
      return false;
    }

    // Check permissions dan GPS
    const locationStatus = await getCurrentLocationStatus();
    if (!locationStatus.canGetLocation) {
      console.warn('[tracking] Location not available:', locationStatus);
      showLocationRequiredAlert();
      return false;
    }

    // Stop tracking yang sedang berjalan
    stopTracking();

    // Set tracking active
    isTrackingActive = true;
    await AsyncStorage.setItem(TRACKING_ACTIVE_KEY, '1');

    // Show location notification
    showLocationNotification();

    // Start location monitoring
    const monitoringStarted = await startLocationMonitoring(
      {
        checkIntervalMs: 30000, // Check status setiap 30 detik
        showLocationNotification: true,
      },
      async (status: LocationStatus) => {
        // Callback ketika status lokasi berubah
        if (!status.canGetLocation && isTrackingActive) {
          console.warn('[tracking] Location became unavailable during tracking');
          showLocationRequiredAlert();
        }
      },
      async (location: LocationResult) => {
        // Callback ketika lokasi berubah - kirim ke API
        if (isTrackingActive) {
          await sendLocationData(tenantId, location); // Auto-detect batch ID
        }
      }
    );

    if (!monitoringStarted) {
      console.error('[tracking] Failed to start location monitoring');
      isTrackingActive = false;
      await AsyncStorage.removeItem(TRACKING_ACTIVE_KEY);
      return false;
    }

    // Start interval tracking untuk background (setiap 1 menit)
    trackingInterval = setInterval(async () => {
      if (!isTrackingActive) return;

      console.log('[tracking] Background location tracking - getting current location...');
      
      // Get current location instead of last known location
      const location = await getCurrentLocation();
      if (location) {
        await sendLocationData(tenantId, location); // Auto-detect batch ID
        console.log('[tracking] Background location sent:', location);
      } else {
        console.warn('[tracking] Failed to get current location for background tracking');
        
        // Fallback to last known location
        const lastLocation = getLastKnownLocation();
        if (lastLocation) {
          await sendLocationData(tenantId, lastLocation); // Auto-detect batch ID
          console.log('[tracking] Background location sent (fallback):', lastLocation);
        }
      }
    }, BACKGROUND_TRACKING_INTERVAL_MS);

    console.log('[tracking] Tracking started with location monitoring');
    return true;
  } catch (error: any) {
    console.error('[tracking] Error starting tracking:', error.message);
    return false;
  }
}

// Stop tracking
export function stopTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval);
    trackingInterval = null;
  }
  
  // Stop location monitoring
  stopLocationMonitoring();
  
  // Stop location notification
  if (Platform.OS === 'android') {
    const { NativeModules } = require('react-native');
    if (NativeModules.LocationTrackingModule) {
      try {
        NativeModules.LocationTrackingModule.stopLocationNotification();
        console.log('[tracking] Android location notification stopped');
      } catch (error) {
        console.warn('[tracking] Failed to stop Android notification:', error);
      }
    }
  }
  
  isTrackingActive = false;
  AsyncStorage.removeItem(TRACKING_ACTIVE_KEY);
  
  console.log('[tracking] Tracking stopped');
}

// Send location saat login
export async function sendLoginLocation(tenantId: string): Promise<boolean> {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      console.warn('[tracking] Failed to get location for login');
      return false;
    }

    return await sendLocationData(tenantId, location, 'LOGIN');
  } catch (error: any) {
    console.error('[tracking] Error sending login location:', error.message);
    return false;
  }
}

// Check tracking status
export function isTracking(): boolean {
  return isTrackingActive;
}

// Get tracking config
export async function getTrackingConfig(tenantId: string): Promise<TrackingConfig | null> {
  try {
    const isEnabled = await checkTrackingEnabled(tenantId);
    return {
      isEnabled,
      intervalMs: TRACKING_INTERVAL_MS,
      tenantId
    };
  } catch (error: any) {
    console.error('[tracking] Error getting tracking config:', error.message);
    return null;
  }
}

// Initialize tracking saat login
export async function initializeTracking(tenantId: string): Promise<boolean> {
  try {
    console.log('[tracking] Initializing tracking for tenant:', tenantId);
    
    // Check apakah tracking diaktifkan
    const isEnabled = await checkTrackingEnabled(tenantId);
    if (!isEnabled) {
      console.log('[tracking] Tracking not enabled for this tenant');
      return false;
    }

    // Send login location
    const loginSuccess = await sendLoginLocation(tenantId);
    if (!loginSuccess) {
      console.warn('[tracking] Failed to send login location');
    }

    // Start tracking
    const trackingSuccess = await startTracking(tenantId);
    if (!trackingSuccess) {
      console.warn('[tracking] Failed to start tracking');
    }

    return loginSuccess || trackingSuccess;
  } catch (error: any) {
    console.error('[tracking] Error initializing tracking:', error.message);
    return false;
  }
}

// Cleanup tracking
export function cleanupTracking(): void {
  stopTracking();
  console.log('[tracking] Tracking cleaned up');
}

// Re-export functions from locationMonitor for convenience
export {
  startLocationMonitoring, 
  stopLocationMonitoring, 
  getCurrentLocationStatus,
  getLastKnownLocation
} from './locationMonitor';

// Force location check
export async function forceLocationCheck(): Promise<LocationStatus> {
  return await getCurrentLocationStatus();
}