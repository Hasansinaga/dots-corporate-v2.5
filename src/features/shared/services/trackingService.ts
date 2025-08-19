// src/shared/services/trackingService.ts
import Geolocation from 'react-native-geolocation-service'
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native'
import API from './APIManager'

type PermParam = Parameters<typeof PermissionsAndroid.check>[0]
type RequestResult = Awaited<ReturnType<typeof PermissionsAndroid.request>>

export async function ensureLocationReady(): Promise<boolean> {
  // iOS: izin via Info.plist, skip di sini
  if (Platform.OS !== 'android') return true

  const FINE_LOCATION =
    (PermissionsAndroid.PERMISSIONS?.ACCESS_FINE_LOCATION ??
      'android.permission.ACCESS_FINE_LOCATION') as PermParam

  const has = await PermissionsAndroid.check(FINE_LOCATION)
  if (!has) {
    const granted: RequestResult = await PermissionsAndroid.request(FINE_LOCATION, {
      title: 'Izin Lokasi Diperlukan',
      message: 'Aplikasi memerlukan akses lokasi untuk tracking.',
      buttonPositive: 'OK',
      buttonNegative: 'Batal',
    })

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert('Izin Lokasi Diperlukan', 'Aktifkan izin lokasi di pengaturan lalu coba lagi.')
      return false
    }
  }

  const gpsOk = await new Promise<boolean>((resolve) => {
    Geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
    )
  })
  if (!gpsOk) {
    Alert.alert('GPS Diperlukan', 'Aktifkan GPS di pengaturan.', [
      { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
      { text: 'Tutup', style: 'cancel' },
    ])
    return false
  }

  return true
}

export async function startLocationInterval() {
  Geolocation.getCurrentPosition(
    async (pos) => {
      try {
        await API.post('/mobile-corporate/user-locations', {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          desc: 'Login',
        })
      } catch {}
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  )
}
