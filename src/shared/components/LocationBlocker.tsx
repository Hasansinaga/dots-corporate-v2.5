import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { LocationStatus } from '../services/tracking/types';
import { showLocationRequiredAlert } from '../services/tracking/locationPermissions';
import { getCurrentLocationStatus } from '../services/tracking/locationMonitor';

interface LocationBlockerProps {
  children: React.ReactNode;
  onLocationStatusChange?: (status: LocationStatus) => void;
}

export default function LocationBlocker({ children, onLocationStatusChange }: LocationBlockerProps) {
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkLocationStatus = useCallback(async () => {
    try {
      const status = await getCurrentLocationStatus();
      setLocationStatus(status);
      setIsChecking(false);
      
      onLocationStatusChange?.(status);
      
      // Show alert if location is not available (but not too aggressive)
      if (!status.canGetLocation && !isChecking) {
        // Only show alert if we've been checking for a while
        setTimeout(() => {
          if (!status.canGetLocation) {
            showLocationRequiredAlert();
          }
        }, 5000); // Wait 5 seconds before showing alert
      }
    } catch (error) {
      console.error('[LocationBlocker] Error checking location status:', error);
      setIsChecking(false);
    }
  }, [onLocationStatusChange, isChecking]);

  useEffect(() => {
    checkLocationStatus();
    
    // Check location status setiap 60 detik (less aggressive)
    const interval = setInterval(checkLocationStatus, 60000);
    
    return () => clearInterval(interval);
  }, [checkLocationStatus]);

  const handleRetry = () => {
    setIsChecking(true);
    checkLocationStatus();
  };

  const handleOpenSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('[LocationBlocker] Error opening settings:', error);
      Alert.alert(
        'Buka Settings',
        'Silakan buka Settings secara manual untuk mengaktifkan lokasi',
        [{ text: 'OK' }]
      );
    }
  };

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Memeriksa Lokasi...</Text>
          <Text style={styles.subtitle}>Mohon tunggu sebentar</Text>
        </View>
      </View>
    );
  }

  // Show blocker if location is not available
  if (!locationStatus?.canGetLocation) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Lokasi Diperlukan</Text>
          <Text style={styles.subtitle}>
            Aplikasi memerlukan akses lokasi untuk berfungsi dengan baik.
          </Text>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Status Lokasi:</Text>
            <Text style={[styles.statusItem, !locationStatus?.hasLocationPermission && styles.statusError]}>
              • Izin Lokasi: {locationStatus?.hasLocationPermission ? 'Aktif' : 'Tidak Aktif'}
            </Text>
            <Text style={[styles.statusItem, !locationStatus?.isGpsEnabled && styles.statusError]}>
              • GPS: {locationStatus?.isGpsEnabled ? 'Aktif' : 'Tidak Aktif'}
            </Text>
            <Text style={[styles.statusItem, !locationStatus?.isLocationEnabled && styles.statusError]}>
              • Layanan Lokasi: {locationStatus?.isLocationEnabled ? 'Aktif' : 'Tidak Aktif'}
            </Text>
          </View>

          {locationStatus?.locationError && (
            <Text style={styles.errorText}>
              Error: {locationStatus.locationError}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            <Text style={styles.retryButton} onPress={handleRetry}>
              Coba Lagi
            </Text>
            <Text style={styles.settingsButton} onPress={handleOpenSettings}>
              Buka Settings
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Show children if location is available
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  statusContainer: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statusItem: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statusError: {
    color: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    color: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: typography.primary.bold,
  },
  settingsButton: {
    backgroundColor: colors.surface,
    color: colors.text,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: typography.primary.bold,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
