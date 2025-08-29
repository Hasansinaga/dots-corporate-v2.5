import React, { useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../stores/useAuth';
import { colors, spacing, typography } from '../../../theme';
import { initializeGlobalTracking, startGlobalTracking, debugTrackingSetup } from '../../../shared/services/tracking';


// Components
import { HomeHeader, BatchCard, QuickActions } from '../components';

// Hooks
import { useHomeTracking, useHomeBatch } from '../hooks';



export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const name = user?.username ?? 'User';

  // Custom hooks
  const {
    trackingActive,
    locationRequired,
    locationAvailable,
    monitoringActive,
    refreshTrackingStatus,
    handleTrackingBadgePress,
    cleanup: cleanupTracking,
  } = useHomeTracking();

  const {
    batchActive,
    batchCode,
    totalMoney,
    totalDeposit,
    startBatch,
    stopBatch,
    finishTransfer,
  } = useHomeBatch();



  // Navigation handlers
  const goDaftarNasabah = useCallback(() => {
    const parent = navigation.getParent?.();
    if (parent) parent.navigate('DaftarNasabah');
    else navigation.navigate('DaftarNasabah');
  }, [navigation]);

  const handleSejarahBatch = useCallback(() => {
    // TODO: Implement sejarah batch navigation
    console.log('[home] Sejarah batch pressed');
  }, []);

  const handlePengajuanPinjaman = useCallback(() => {
    // TODO: Implement pengajuan pinjaman navigation
    console.log('[home] Pengajuan pinjaman pressed');
  }, []);

  const handleSimulasiKredit = useCallback(() => {
    // TODO: Implement simulasi kredit navigation
    console.log('[home] Simulasi kredit pressed');
  }, []);

  const handleUKM = useCallback(() => {
    // TODO: Implement UKM navigation
    console.log('[home] UKM pressed');
  }, []);



  // Initialize tracking on focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const initialize = async () => {
        if (!mounted) return;

        // Initialize global tracking if user is logged in
        if (user?.tenantId) {
          try {
            console.log('[home] Preparing global tracking for tenant:', user.tenantId);
            
            // Debug tracking setup
            await debugTrackingSetup(user.tenantId);
            
            await initializeGlobalTracking(user.tenantId);
            console.log('[home] Global tracking prepared');
            
            // Start tracking after a delay to let user settle in
            setTimeout(async () => {
              if (mounted && user?.tenantId) {
                try {
                  console.log('[home] Starting global tracking...');
                  await startGlobalTracking(user.tenantId);
                  console.log('[home] Global tracking started');
                } catch (error) {
                  console.warn('[home] Failed to start global tracking:', error);
                }
              }
            }, 3000); // 3 second delay
          } catch (error) {
            console.warn('[home] Failed to prepare global tracking:', error);
          }
        }

        // Refresh the tracking status
        await refreshTrackingStatus();
      };

      initialize();

      return () => {
        mounted = false;
      };
    }, [refreshTrackingStatus, user?.tenantId]),
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTracking();
    };
  }, [cleanupTracking]);

  return (
    <SafeAreaView style={S.container} edges={['top', 'left', 'right']}>
      <View style={S.appbar}>
        <Text style={S.appbarTitle}>BPR Dev</Text>
      </View>

      <View style={S.body}>
        <HomeHeader username={name} />

          <BatchCard
           batchActive={batchActive}
           batchCode={batchCode}
           totalMoney={totalMoney}
           totalDeposit={totalDeposit}
           locationRequired={locationRequired}
           trackingActive={trackingActive}
           gpsEnabled={locationAvailable}
           gpsMonitoringActive={monitoringActive}
           onStartBatch={startBatch}
           onStopBatch={stopBatch}
           onFinishTransfer={finishTransfer}
                      onTrackingBadgePress={handleTrackingBadgePress}
           onForceLocationCheck={async () => {
             await refreshTrackingStatus();
             return locationAvailable;
           }}
           _onGpsBadgePress={() => {
                Alert.alert(
                  'Status GPS',
               `GPS saat ini ${locationAvailable ? 'aktif' : 'tidak aktif'}.\n\nMonitoring GPS: ${monitoringActive ? 'Berjalan' : 'Tidak aktif'}`,
                  [
                    {
                      text: 'Periksa Sekarang',
                      onPress: async () => {
                     await refreshTrackingStatus();
                     Alert.alert('Hasil Pemeriksaan', `GPS saat ini ${locationAvailable ? 'aktif' : 'tidak aktif'}.`);
                      },
                    },
                    { text: 'OK' },
                  ],
                );
              }}
          
        />

        <QuickActions
          onDaftarNasabah={goDaftarNasabah}
          onSejarahBatch={handleSejarahBatch}
          onPengajuanPinjaman={handlePengajuanPinjaman}
          onSimulasiKredit={handleSimulasiKredit}
          onUKM={handleUKM}
        />
      </View>
    </SafeAreaView>
  );
}



const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  appbar: {
    height: 56,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appbarTitle: {
    color: colors.background,
    fontSize: 18,
    letterSpacing: 0.3,
    fontFamily: typography.primary.bold,
  },
  body: { 
    flex: 1,
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.xl, 
    gap: spacing.lg 
  },
});