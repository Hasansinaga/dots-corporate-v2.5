// trackingService.ts - Main tracking service (refactored)
// This is the main entry point that exports all tracking functionality

// Core functionality
export {
  setActiveTenant,
  isTrackingActive,
  getDetailedTrackingStatus,
  type LocationResult,
  type TrackingStatus,
  type CompanyConfigResponse,
} from './trackingCore';

// Permission management
export {
  ensureLocationReady,
  checkLocationServicesEnabled,
  checkGpsCurrently,
} from './locationPermissions';

// Location service
export {
  isLocationTrackingEnabled,
  getCurrentLocationTest,
  sendTestHeartbeat,
  testLocationTrackingAPI,
} from './locationService';

// Background tracking
export {
  startBackgroundTrackingIfEnabled,
  stopBackgroundTracking,
  forceStopAllTracking,
} from './trackingManager';

// Login tracking
export {
  startLoginTrackingIfEnabled,
  startLoginTrackingSafe,
} from './trackingLogin';

// Diagnostics
export {
  performTrackingHealthCheck,
  type HealthCheckResult,
} from './trackingDiagnostics';

// Utilities
export {
  cleanupTracking,
} from './trackingUtils';

// Default export for backward compatibility
export default {
  setActiveTenant: require('./trackingCore').setActiveTenant,
  isLocationTrackingEnabled: require('./locationService').isLocationTrackingEnabled,
  ensureLocationReady: require('./locationPermissions').ensureLocationReady,
  checkLocationServicesEnabled: require('./locationPermissions').checkLocationServicesEnabled,
  checkGpsCurrently: require('./locationPermissions').checkGpsCurrently,
  sendLoginLocationOnce: require('./locationService').sendLoginLocationOnce,
  startLoginTrackingIfEnabled: require('./trackingLogin').startLoginTrackingIfEnabled,
  startLoginTrackingSafe: require('./trackingLogin').startLoginTrackingSafe,
  startBackgroundTrackingIfEnabled: require('./trackingManager').startBackgroundTrackingIfEnabled,
  stopBackgroundTracking: require('./trackingManager').stopBackgroundTracking,
  forceStopAllTracking: require('./trackingManager').forceStopAllTracking,
  isTrackingActive: require('./trackingCore').isTrackingActive,
  getDetailedTrackingStatus: require('./trackingCore').getDetailedTrackingStatus,
  getCurrentLocationTest: require('./locationService').getCurrentLocationTest,
  sendTestHeartbeat: require('./locationService').sendTestHeartbeat,
  testLocationTrackingAPI: require('./locationService').testLocationTrackingAPI,
  performTrackingHealthCheck: require('./trackingDiagnostics').performTrackingHealthCheck,
  cleanupTracking: require('./trackingUtils').cleanupTracking,
};