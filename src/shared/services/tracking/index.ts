// Export semua tracking functionality
export {
  checkTrackingEnabled,
  sendLocationData,
  startTracking,
  stopTracking,
  sendLoginLocation,
  isTracking,
  getTrackingConfig,
  initializeTracking,
  cleanupTracking,
  setActiveTenant,
  getActiveTenant,
} from './trackingService';

export {
  ensureLocationReady,
  checkLocationServicesEnabled,
  checkGpsCurrently,
  geolocationAvailable,
  initializeGeolocation,
  getLocationStatus,
  showLocationRequiredAlert,
} from './locationPermissions';

export {
  startLocationMonitoring,
  stopLocationMonitoring,
  getCurrentLocationStatus,
  getLastKnownLocation,
  isLocationMonitoring,
  forceLocationCheck,
  restartLocationMonitoring,
} from './locationMonitor';

// Export global tracking service
export {
  initializeGlobalTracking,
  startGlobalTracking,
  stopGlobalTracking,
  isGlobalTrackingActive,
  getGlobalTrackingStatus,
  restartGlobalTracking,
  debugTrackingSetup,
} from './globalTrackingService';

// Export types
export type {
  LocationResult,
  CompanyConfigResponse,
  LocationHeartbeatData,
  TrackingConfig,
  LocationStatus,
  LocationMonitorConfig,
} from './types';
