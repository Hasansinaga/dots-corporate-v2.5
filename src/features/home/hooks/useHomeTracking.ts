import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import {
  getGlobalTrackingStatus,
  restartGlobalTracking,
} from '../../../shared/services/tracking';

export function useHomeTracking() {
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [locationRequired, setLocationRequired] = useState<boolean>(false);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [monitoringActive, setMonitoringActive] = useState<boolean>(false);
  
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Refresh tracking status from global service
  const refreshTrackingStatus = useCallback(async () => {
    try {
      const status = await getGlobalTrackingStatus();
      setTrackingActive(status.trackingActive);
      setLocationRequired(status.trackingActive); // If tracking is active, location is required
      setLocationAvailable(status.locationAvailable);
      setMonitoringActive(status.monitoringActive);

      console.log('[home] Global tracking status:', status);
      return status;
    } catch (error) {
      console.warn('[home] Error checking global tracking status:', error);
      setTrackingActive(false);
      setLocationRequired(false);
      setLocationAvailable(false);
      setMonitoringActive(false);
      return null;
    }
  }, []);

  const openLocationSettings = useCallback(async () => {
    try {
      console.log('[home] Opening location settings...');
      await Linking.openSettings();
    } catch (error) {
      console.error('[home] Error opening location settings:', error);
      try {
        await Linking.openURL('app-settings:');
      } catch (fallbackError) {
        console.warn('[home] Fallback settings URL also failed:', fallbackError);
        Alert.alert(
          'Pengaturan Manual',
          'Silakan buka Pengaturan → Lokasi secara manual untuk mengaktifkan GPS.',
          [{ text: 'OK' }],
        );
      }
    }
  }, []);

  // Handle tracking badge press
  const handleTrackingBadgePress = useCallback(async () => {
    if (trackingActive) {
      // Show tracking status
      Alert.alert(
        'Tracking Aktif', 
        `Tracking lokasi sedang berjalan.\n\nGPS: ${locationAvailable ? 'Aktif' : 'Nonaktif'}\nMonitoring: ${monitoringActive ? 'Aktif' : 'Nonaktif'}`, 
        [{ text: 'OK' }]
      );
    } else {
      // Try to restart tracking
      Alert.alert(
        'Tracking Nonaktif',
        'Tracking lokasi tidak aktif. Apakah Anda ingin mencoba mengaktifkannya?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Aktifkan',
            onPress: async () => {
              try {
                const success = await restartGlobalTracking();
                if (success) {
                  await refreshTrackingStatus();
                  Alert.alert('Berhasil', 'Tracking lokasi telah diaktifkan.');
                } else {
                  Alert.alert(
                    'Gagal',
                    'Gagal mengaktifkan tracking lokasi. Pastikan GPS aktif.',
                    [
                      { text: 'Pengaturan', onPress: openLocationSettings },
                      { text: 'OK' },
                    ],
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Error',
                  'Terjadi kesalahan saat mengaktifkan tracking lokasi.',
                  [
                    { text: 'Pengaturan', onPress: openLocationSettings },
                    { text: 'OK' },
                  ],
                );
              }
            },
          },
        ],
      );
    }
  }, [trackingActive, locationAvailable, monitoringActive, refreshTrackingStatus, openLocationSettings]);

  // Set up periodic status check
  useEffect(() => {
    // Check status every 30 seconds
    statusCheckInterval.current = setInterval(() => {
      refreshTrackingStatus();
    }, 30000);

    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    };
  }, [refreshTrackingStatus]);

  // Initial status check
  useEffect(() => {
    refreshTrackingStatus();
  }, [refreshTrackingStatus]);

  return {
    // State
    trackingActive,
    locationRequired,
    locationAvailable,
    monitoringActive,
    
    // Functions
    refreshTrackingStatus,
    handleTrackingBadgePress,
    openLocationSettings,
    
    // Cleanup function
    cleanup: () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    },
  };
}
