// trackingCore.ts - Core tracking functionality
import Geolocation from '@react-native-community/geolocation';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../APIManager';

// Types
export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface TrackingStatus {
  flagActive: boolean;
  watchActive: boolean;
  timerActive: boolean;
  gpsMonitorActive: boolean;
  locationTracking: boolean;
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

// Constants
export const TRACKING_FLAG_KEY = 'trackingActive';
export const HEARTBEAT_MS = 60_000;
export const GPS_CHECK_MS = 30_000;

// Global state
let ACTIVE_TENANT: string | null = null;
let BG_TIMER_ID: ReturnType<typeof setInterval> | null = null;
let WATCH_ID: number | null = null;
let isLocationTracking = false;
let GPS_CHECK_TIMER: ReturnType<typeof setInterval> | null = null;

// Initialize Geolocation
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'auto',
  enableBackgroundLocationUpdates: true,
  locationProvider: 'auto',
});

// Utility functions
export function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  label: string,
): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.warn(`[tracking-safe] ${label}:`, e);
    return fallback;
  }
}

export function geolocationAvailable(): boolean {
  try {
    return !!Geolocation;
  } catch {
    return false;
  }
}

// Tenant management
export function setActiveTenant(ljk: string | number | null | undefined) {
  ACTIVE_TENANT = ljk != null ? String(ljk) : null;
  if (ACTIVE_TENANT) {
    API.defaults.headers.common['X-Tenant-Id'] = ACTIVE_TENANT;
  } else {
    delete API.defaults.headers.common['X-Tenant-Id'];
  }
}

export async function resolveTenantId(override?: string): Promise<string | null> {
  if (override && String(override).trim()) return String(override);
  if (ACTIVE_TENANT && ACTIVE_TENANT.trim()) return ACTIVE_TENANT;

  try {
    const fromDefaults =
      API.defaults.headers.common?.['X-Tenant-Id'] ??
      API.defaults.headers.common?.['x-tenant-id'];
    if (typeof fromDefaults === 'string' && fromDefaults.trim())
      return fromDefaults;
  } catch {}

  try {
    const fromStorage = await AsyncStorage.getItem('kodeKantor');
    if (fromStorage && fromStorage.trim()) return fromStorage;
  } catch {}

  console.warn('[tracking] Tenant ID tidak ditemukan.');
  return null;
}

export async function getAuthHeaders(overrideLjk?: string) {
  let token = await AsyncStorage.getItem('authToken');
  const ljk = await resolveTenantId(overrideLjk);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (ljk) headers['X-Tenant-Id'] = ljk;

  if (token) {
    if (!/^Bearer\s+/i.test(token)) token = `Bearer ${token}`;
    headers.Authorization = token;
  }

  console.log(
    '[tracking] auth hdr -> tenant:',
    ljk,
    '| tokenLen:',
    token ? token.length : 0,
  );
  return headers;
}

// State getters/setters
export function getLocationTrackingState() {
  return {
    isTracking: isLocationTracking,
    activeTenant: ACTIVE_TENANT,
    timerActive: BG_TIMER_ID !== null,
    watchActive: WATCH_ID !== null,
    gpsMonitorActive: GPS_CHECK_TIMER !== null,
  };
}

export function setLocationTrackingState(tracking: boolean) {
  isLocationTracking = tracking;
}

export function getTimerIds() {
  return {
    bgTimer: BG_TIMER_ID,
    watchId: WATCH_ID,
    gpsTimer: GPS_CHECK_TIMER,
  };
}

export function setTimerIds(ids: {
  bgTimer?: ReturnType<typeof setInterval> | null;
  watchId?: number | null;
  gpsTimer?: ReturnType<typeof setInterval> | null;
}) {
  if (ids.bgTimer !== undefined) BG_TIMER_ID = ids.bgTimer;
  if (ids.watchId !== undefined) WATCH_ID = ids.watchId;
  if (ids.gpsTimer !== undefined) GPS_CHECK_TIMER = ids.gpsTimer;
}

export async function isTrackingActive(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(TRACKING_FLAG_KEY);
    const active = flag === '1';
    console.log('[tracking] Tracking active status:', active);
    return active;
  } catch (error) {
    console.error('[tracking] Error checking tracking status:', error);
    return false;
  }
}

export async function getDetailedTrackingStatus(): Promise<TrackingStatus> {
  try {
    const flag = await AsyncStorage.getItem(TRACKING_FLAG_KEY);
    const flagActive = flag === '1';
    
    return {
      flagActive,
      watchActive: WATCH_ID !== null,
      timerActive: BG_TIMER_ID !== null,
      gpsMonitorActive: GPS_CHECK_TIMER !== null,
      locationTracking: isLocationTracking,
    };
  } catch (error) {
    console.error('[tracking] Error getting detailed tracking status:', error);
    return {
      flagActive: false,
      watchActive: false,
      timerActive: false,
      gpsMonitorActive: false,
      locationTracking: false,
    };
  }
}