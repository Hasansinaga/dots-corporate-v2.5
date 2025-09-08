import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { cfgsysService } from '../services/cfgsysService';
import { getTenantIdWithFallback } from '../utils/tenantUtils';
import {
  getGlobalTrackingStatus,
  restartGlobalTracking,
} from '../services/tracking';

interface UseLocationConfigOptions {
  ljkCode?: string;
  autoLoad?: boolean;
}

interface UseLocationConfigReturn {
  // Location tracking states
  trackingActive: boolean;
  locationRequired: boolean;
  locationAvailable: boolean;
  monitoringActive: boolean;
  
  // Configuration states
  isLocationTrackingEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Functions
  refreshTrackingStatus: () => Promise<any>;
  handleTrackingBadgePress: () => Promise<void>;
  openLocationSettings: () => Promise<void>;
  loadLocationConfig: () => Promise<void>;
  refreshLocationConfig: () => Promise<void>;
  
  // Cleanup
  cleanup: () => void;
}

export function useLocationConfig(options: UseLocationConfigOptions = {}): UseLocationConfigReturn {
  const { ljkCode, autoLoad = true } = options;
  
  // Location tracking states
  const [trackingActive, setTrackingActive] = useState<boolean>(false);
  const [locationRequired, setLocationRequired] = useState<boolean>(false);
  const [locationAvailable, setLocationAvailable] = useState<boolean>(false);
  const [monitoringActive, setMonitoringActive] = useState<boolean>(false);
  
  // Configuration states
  const [isLocationTrackingEnabled, setIsLocationTrackingEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const statusCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Load location tracking configuration
  const loadLocationConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get tenant ID from storage or use provided ljkCode
      const tenantId = ljkCode || await getTenantIdWithFallback();
      console.log('[location-config] Loading location tracking config for LJK:', tenantId);
      const config = await cfgsysService.getCompanyConfig(tenantId, 'MBCORP_LOCATION_TRACK');
      
      if (config) {
        // Location tracking is enabled if numvalue1 OR numvalue2 equals 1
        const enabled = config.numvalue1 === 1 || config.numvalue2 === 1;
        setIsLocationTrackingEnabled(enabled);
        console.log('[location-config] Location tracking config:', {
          code: config.code,
          numvalue1: config.numvalue1,
          numvalue2: config.numvalue2,
          enabled: enabled
        });
      } else {
        setIsLocationTrackingEnabled(false);
        console.log('[location-config] No location tracking config found');
      }
    } catch (err: any) {
      console.error('[location-config] Error loading location config:', err);
      setError(err.message || 'Failed to load location tracking config');
      setIsLocationTrackingEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [ljkCode]);

  // Refresh location configuration
  const refreshLocationConfig = useCallback(async () => {
    await loadLocationConfig();
  }, [loadLocationConfig]);

  // Refresh tracking status from global service
  const refreshTrackingStatus = useCallback(async () => {
    try {
      const status = await getGlobalTrackingStatus();
      setTrackingActive(status.trackingActive);
      setLocationRequired(status.trackingActive); // If tracking is active, location is required
      setLocationAvailable(status.locationAvailable);
      setMonitoringActive(status.monitoringActive);

      console.log('[location-config] Global tracking status:', status);
      return status;
    } catch (error) {
      console.warn('[location-config] Error checking global tracking status:', error);
      setTrackingActive(false);
      setLocationRequired(false);
      setLocationAvailable(false);
      setMonitoringActive(false);
      return null;
    }
  }, []);

  const openLocationSettings = useCallback(async () => {
    try {
      console.log('[location-config] Opening location settings...');
      await Linking.openSettings();
    } catch (error) {
      console.error('[location-config] Error opening location settings:', error);
      try {
        await Linking.openURL('app-settings:');
      } catch (fallbackError) {
        console.warn('[location-config] Fallback settings URL also failed:', fallbackError);
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

  // Auto load configuration on mount
  useEffect(() => {
    if (autoLoad) {
      loadLocationConfig();
    }
  }, [autoLoad, loadLocationConfig]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (statusCheckInterval.current) {
      clearInterval(statusCheckInterval.current);
      statusCheckInterval.current = null;
    }
  }, []);

  return {
    // Location tracking states
    trackingActive,
    locationRequired,
    locationAvailable,
    monitoringActive,
    
    // Configuration states
    isLocationTrackingEnabled,
    isLoading,
    error,
    
    // Functions
    refreshTrackingStatus,
    handleTrackingBadgePress,
    openLocationSettings,
    loadLocationConfig,
    refreshLocationConfig,
    
    // Cleanup
    cleanup,
  };
}
