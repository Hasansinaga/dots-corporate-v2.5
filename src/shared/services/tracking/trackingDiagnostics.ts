// trackingDiagnostics.ts - Health checks and diagnostic functions
import { ensurePermission, checkLocationServicesEnabled } from './locationPermissions';
import { isLocationTrackingEnabled, testLocationTrackingAPI } from './locationService';
import { geolocationAvailable } from './trackingCore';

export interface HealthCheckResult {
  overall: 'healthy' | 'warning' | 'error';
  checks: {
    geolocationAvailable: boolean;
    permissions: boolean;
    gpsEnabled: boolean;
    serverConfig: boolean;
    apiConnection: boolean;
  };
  details: string[];
}

// Comprehensive health check
export async function performTrackingHealthCheck(overrideLjk?: string): Promise<HealthCheckResult> {
  const checks = {
    geolocationAvailable: false,
    permissions: false,
    gpsEnabled: false,
    serverConfig: false,
    apiConnection: false,
  };
  const details: string[] = [];
  
  try {
    // Check geolocation availability
    checks.geolocationAvailable = geolocationAvailable();
    if (checks.geolocationAvailable) {
      details.push('✅ Geolocation service available');
    } else {
      details.push('❌ Geolocation service not available');
    }
    
    // Check permissions
    checks.permissions = await ensurePermission();
    if (checks.permissions) {
      details.push('✅ Location permissions granted');
    } else {
      details.push('❌ Location permissions not granted');
    }
    
    // Check GPS
    checks.gpsEnabled = await checkLocationServicesEnabled();
    if (checks.gpsEnabled) {
      details.push('✅ GPS/Location services enabled');
    } else {
      details.push('❌ GPS/Location services disabled');
    }
    
    // Check server config
    checks.serverConfig = await isLocationTrackingEnabled(overrideLjk);
    if (checks.serverConfig) {
      details.push('✅ Server tracking config enabled');
    } else {
      details.push('ℹ️ Server tracking config disabled or not found');
    }
    
    // Check API connection
    const apiTest = await testLocationTrackingAPI(overrideLjk);
    checks.apiConnection = apiTest.success;
    if (checks.apiConnection) {
      details.push('✅ API connection successful');
    } else {
      details.push(`❌ API connection failed: ${apiTest.error}`);
    }
    
  } catch (error) {
    details.push(`❌ Health check error: ${error}`);
  }
  
  // Determine overall health
  let overall: 'healthy' | 'warning' | 'error' = 'healthy';
  
  if (!checks.geolocationAvailable || !checks.permissions || !checks.gpsEnabled) {
    overall = 'error';
  } else if (!checks.serverConfig || !checks.apiConnection) {
    overall = 'warning';
  }
  
  return { overall, checks, details };
}