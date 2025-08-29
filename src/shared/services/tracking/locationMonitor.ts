// locationMonitor.ts - Continuous location monitoring
import { Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { LocationResult, LocationStatus, LocationMonitorConfig } from './types';
import { 
  ensureLocationReady, 
  checkLocationServicesEnabled, 
  checkGpsCurrently,
  showLocationRequiredAlert 
} from './locationPermissions';

// Default configuration
const DEFAULT_CONFIG: LocationMonitorConfig = {
  checkIntervalMs: 30000, // 30 detik
  locationTimeoutMs: 10000, // 10 detik
  maxRetries: 3,
  enableBackgroundUpdates: true,
  showLocationNotification: true,
};

// Global state
let locationWatchId: number | null = null;
let statusCheckInterval: NodeJS.Timeout | null = null;
let isMonitoring = false;
let lastKnownLocation: LocationResult | null = null;
let lastLocationTime: number = 0;
let locationError: string | null = null;
let onLocationStatusChange: ((status: LocationStatus) => void) | null = null;
let onLocationChange: ((location: LocationResult) => void) | null = null;

// Get current location status
export async function getCurrentLocationStatus(): Promise<LocationStatus> {
  const hasPermission = await ensureLocationReady();
  const gpsEnabled = await checkGpsCurrently();
  const locationServicesEnabled = await checkLocationServicesEnabled();
  
  return {
    isLocationEnabled: locationServicesEnabled,
    isGpsEnabled: gpsEnabled,
    hasLocationPermission: hasPermission,
    canGetLocation: hasPermission && gpsEnabled && locationServicesEnabled,
    lastKnownLocation,
    lastLocationTime,
    locationError: locationError || undefined,
  };
}

// Start continuous location monitoring
export async function startLocationMonitoring(
  config: Partial<LocationMonitorConfig> = {},
  onStatusChange?: (status: LocationStatus) => void,
  onLocationUpdate?: (location: LocationResult) => void
): Promise<boolean> {
  try {
    console.log('[location-monitor] Starting location monitoring...');
    
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    onLocationStatusChange = onStatusChange;
    onLocationChange = onLocationUpdate;
    
    // Check initial status
    const initialStatus = await getCurrentLocationStatus();
    
    if (!initialStatus.canGetLocation) {
      console.warn('[location-monitor] Cannot start monitoring - location not available');
      showLocationRequiredAlert();
      onLocationStatusChange?.(initialStatus);
      return false;
    }
    
    // Start location watching
    await startLocationWatching(finalConfig);
    
    // Start status monitoring
    startStatusMonitoring(finalConfig.checkIntervalMs);
    
    isMonitoring = true;
    console.log('[location-monitor] Location monitoring started');
    
    onLocationStatusChange?.(initialStatus);
    return true;
    
  } catch (error: any) {
    console.error('[location-monitor] Error starting monitoring:', error.message);
    return false;
  }
}

// Stop location monitoring
export function stopLocationMonitoring(): void {
  console.log('[location-monitor] Stopping location monitoring...');
  
  if (locationWatchId !== null) {
    Geolocation.clearWatch(locationWatchId);
    locationWatchId = null;
  }
  
  if (statusCheckInterval !== null) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
  
  isMonitoring = false;
  onLocationStatusChange = null;
  onLocationChange = null;
  
  console.log('[location-monitor] Location monitoring stopped');
}

// Start location watching
async function startLocationWatching(_config: LocationMonitorConfig): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const options = {
        enableHighAccuracy: true,
        distanceFilter: 5, // Update setiap 5 meter untuk background tracking
        interval: 60000, // Update setiap 1 menit untuk background
        fastestInterval: 30000, // Fastest update 30 detik
        showLocationDialog: true, // Selalu tampilkan dialog lokasi
        forceRequestLocation: true,
        // Background options untuk notifikasi
        allowsBackgroundLocationUpdates: true,
        showsBackgroundLocationIndicator: true,
        // iOS specific options untuk notifikasi
        ...(Platform.OS === 'ios' && {
          activityType: 'fitness',
          pausesLocationUpdatesAutomatically: false,
        }),
        // Android specific options untuk notifikasi
        ...(Platform.OS === 'android' && {
          startForeground: true,
          notificationTitle: 'Location Tracking Active',
          notificationText: 'Aplikasi sedang melacak lokasi Anda',
        }),
      };
      
      locationWatchId = Geolocation.watchPosition(
        (position) => {
          const location: LocationResult = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          lastKnownLocation = location;
          lastLocationTime = Date.now();
          locationError = null;
          
          console.log('[location-monitor] Location updated:', location);
          onLocationChange?.(location);
          
          // Update status
          updateLocationStatus();
        },
        (error) => {
          locationError = error.message;
          console.warn('[location-monitor] Location watch error:', error.message);
          
          // Update status
          updateLocationStatus();
          
          // Show alert if critical error
          if (error.code === 1) { // PERMISSION_DENIED
            showLocationRequiredAlert();
          }
        },
        options
      );
      
      resolve();
    } catch (error: any) {
      reject(error);
    }
  });
}

// Start status monitoring
function startStatusMonitoring(checkIntervalMs: number): void {
  statusCheckInterval = setInterval(async () => {
    if (!isMonitoring) return;
    
    const status = await getCurrentLocationStatus();
    
    // Check if location became unavailable
    if (!status.canGetLocation && lastKnownLocation) {
      console.warn('[location-monitor] Location became unavailable');
      showLocationRequiredAlert();
    }
    
    // Update status
    updateLocationStatus();
  }, checkIntervalMs);
}

// Update location status
async function updateLocationStatus(): Promise<void> {
  const status = await getCurrentLocationStatus();
  onLocationStatusChange?.(status);
}

// Get last known location
export function getLastKnownLocation(): LocationResult | null {
  return lastKnownLocation;
}

// Check if monitoring is active
export function isLocationMonitoring(): boolean {
  return isMonitoring;
}

// Force location check
export async function forceLocationCheck(): Promise<LocationResult | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[location-monitor] Force location check timeout');
      resolve(null);
    }, 10000);
    
    Geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeout);
        const location: LocationResult = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        
        lastKnownLocation = location;
        lastLocationTime = Date.now();
        locationError = null;
        
        resolve(location);
      },
      (error) => {
        clearTimeout(timeout);
        locationError = error.message;
        console.warn('[location-monitor] Force location check failed:', error.message);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 5000,
      }
    );
  });
}

// Show location notification
export function showLocationNotification(): void {
  if (Platform.OS === 'ios') {
    // iOS akan menampilkan notifikasi otomatis
    console.log('[location-monitor] iOS location notification will be shown automatically');
  } else if (Platform.OS === 'android') {
    // Android perlu notifikasi manual 
    console.log('[location-monitor] Android location notification should be shown');
    
    // Import NativeModules untuk Android
    const { NativeModules } = require('react-native');
    if (NativeModules.LocationTrackingModule) {
      try {
        NativeModules.LocationTrackingModule.startLocationNotification();
        console.log('[location-monitor] Android location notification started');
      } catch (error) {
        console.warn('[location-monitor] Failed to start Android notification:', error);
      }
    } else {
      console.warn('[location-monitor] LocationTrackingModule not found');
    }
  }
}

// Restart monitoring if needed
export async function restartLocationMonitoring(): Promise<boolean> {
  console.log('[location-monitor] Restarting location monitoring...');
  
  stopLocationMonitoring();
  
  // Wait a bit before restarting
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return startLocationMonitoring();
}
