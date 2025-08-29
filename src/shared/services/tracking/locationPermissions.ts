// locationPermissions.ts - Permission management untuk location tracking
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { LocationStatus } from './types';

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

// Initialize Geolocation dengan background updates dan notifications
export function initializeGeolocation() {
  try {
    // Configure geolocation untuk menampilkan notifikasi
    if (Platform.OS === 'ios') {
      // iOS akan menampilkan notifikasi otomatis saat menggunakan lokasi
      console.log('[tracking] Geolocation initialized for iOS with location notifications');
    } else if (Platform.OS === 'android') {
      // Android perlu konfigurasi khusus untuk notifikasi
      console.log('[tracking] Geolocation initialized for Android with location notifications');
    }
  } catch (error) {
    console.warn('[tracking] Error initializing geolocation:', error);
  }
}

// Check dan request location permissions dengan retry
export async function ensureLocationReady(): Promise<boolean> {
  if (!geolocationAvailable()) {
    console.warn('[tracking] Geolocation not available');
    return false;
  }

  try {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('always'); // Request 'always' untuk background
      const granted = auth === 'granted';
      
      if (!granted) {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan akses lokasi untuk berfungsi. Silakan aktifkan di Settings.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Settings', onPress: () => {} } // Bisa ditambahkan link ke settings
          ]
        );
      }
      
      return granted;
    } else if (Platform.OS === 'android') {
      // Request multiple permissions untuk Android
      const permissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ];

      // Check existing permissions
      const hasFine = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      const hasCoarse = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION);
      const hasNotification = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

      if (hasFine && hasCoarse && hasNotification) {
        return true;
      }

      // Request permissions
      const results = await PermissionsAndroid.requestMultiple(permissions);
      
      const fineGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const notificationGranted = results[PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS] === PermissionsAndroid.RESULTS.GRANTED;

      console.log('[tracking] Permission results:', {
        fine: fineGranted,
        coarse: coarseGranted,
        notification: notificationGranted
      });

      if (!fineGranted && !coarseGranted) {
        Alert.alert(
          'Izin Lokasi Diperlukan',
          'Aplikasi memerlukan akses lokasi untuk berfungsi. Silakan aktifkan di Settings.',
          [
            { text: 'Batal', style: 'cancel' },
            { text: 'Settings', onPress: () => {} }
          ]
        );
        return false;
      }

      // Request background location untuk Android 10+ (API 29+)
      if (Platform.Version >= 29) {
        try {
          const backgroundResult = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
                title: 'Izin Lokasi Background',
                message: 'Untuk tracking yang akurat, aplikasi memerlukan akses lokasi di background.',
                buttonPositive: 'OK',
                buttonNegative: 'Nanti',
            }
          );

          if (backgroundResult !== PermissionsAndroid.RESULTS.GRANTED) {
            console.warn('[tracking] Background location permission denied');
            }
          } catch (bgError) {
          console.warn('[tracking] Background permission request failed:', bgError);
          }
        }

      return fineGranted || coarseGranted;
    }
    return false;
      } catch (error) {
    console.error('[tracking] Error requesting location permission:', error);
        return false;
      }
}

// Check if location services are enabled dengan retry
export async function checkLocationServicesEnabled(): Promise<boolean> {
  return safeAsync(
    async () => {
      return new Promise((resolve) => {
    let resolved = false;

        const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
            resolve(false);
          }
        }, 5000);

      Geolocation.getCurrentPosition(
          () => {
            if (!resolved) {
          clearTimeout(timeout);
              resolved = true;
              resolve(true);
            }
        },
          (error) => {
            if (!resolved) {
          clearTimeout(timeout);
              resolved = true;
              console.warn('[tracking] Location services check failed:', error.message);
              resolve(false);
            }
        },
        {
          enableHighAccuracy: false,
            timeout: 4000, 
            maximumAge: 10000 
          }
        );
      });
    },
    false,
    'checkLocationServicesEnabled'
  );
}

// Check GPS status dengan retry dan fallback
export async function checkGpsCurrently(): Promise<boolean> {
  return safeAsync(
    async () => {
      // Try multiple times with different settings
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await new Promise<boolean>((resolve) => {
    let resolved = false;

            const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
                resolve(false);
              }
            }, 5000); // Increased timeout

      Geolocation.getCurrentPosition(
        (position) => {
          if (!resolved) {
                  clearTimeout(timeout);
                  resolved = true;
                  console.log(`[tracking] GPS check attempt ${attempt} succeeded:`, {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy
                  });
                  resolve(true);
          }
        },
        (error) => {
                  if (!resolved) {
                  clearTimeout(timeout);
                  resolved = true;
                  console.warn(`[tracking] GPS check attempt ${attempt} failed:`, error.message);
                  resolve(false);
                }
              },
              { 
                enableHighAccuracy: attempt === 1, // High accuracy only on first attempt
                timeout: 4000, 
                maximumAge: 10000 
              }
            );
          });

          if (result) {
            return true;
          }

          // Wait before next attempt
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.warn(`[tracking] GPS check attempt ${attempt} error:`, error);
        }
      }

      console.warn('[tracking] All GPS check attempts failed');
      return false;
    },
    false,
    'checkGpsCurrently'
  );
}

// Get comprehensive location status
export async function getLocationStatus(): Promise<LocationStatus> {
  const hasPermission = await ensureLocationReady();
  const gpsEnabled = await checkGpsCurrently();
  const locationServicesEnabled = await checkLocationServicesEnabled();
  
  return {
    isLocationEnabled: locationServicesEnabled,
    isGpsEnabled: gpsEnabled,
    hasLocationPermission: hasPermission,
    canGetLocation: hasPermission && gpsEnabled && locationServicesEnabled,
  };
}

// Show location required alert
export function showLocationRequiredAlert(): void {
  Alert.alert(
    'Lokasi Diperlukan',
    'Aplikasi memerlukan lokasi untuk berfungsi. Silakan aktifkan GPS dan izin lokasi.',
    [
      { text: 'OK', onPress: () => {} }
    ]
  );
}