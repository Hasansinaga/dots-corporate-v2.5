// Types untuk tracking service
export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface CompanyConfigResponse {
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

export interface LocationHeartbeatData {
  latitude: number;
  longitude: number;
  desc: string;
  created_at: string;
}

export interface TrackingConfig {
  isEnabled: boolean;
  intervalMs: number;
  tenantId: string;
}

export interface LocationStatus {
  isLocationEnabled: boolean;
  isGpsEnabled: boolean;
  hasLocationPermission: boolean;
  canGetLocation: boolean;
  lastKnownLocation?: LocationResult;
  lastLocationTime?: number;
  locationError?: string;
}

export interface LocationMonitorConfig {
  checkIntervalMs: number;
  locationTimeoutMs: number;
  maxRetries: number;
  enableBackgroundUpdates: boolean;
  showLocationNotification: boolean;
}
