import React, { useCallback, useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../stores/useAuth';
import { colors, spacing, typography } from '../../../theme';
import { initializeGlobalTracking, startGlobalTracking, debugTrackingSetup } from '../../../shared/services/tracking';


// Components
import { HomeHeader, BatchCardWrapper, QuickActions } from '../components';
import { AppBar } from '../../../shared/components';

// Hooks
import { useHomeTracking, useHomeBatch } from '../hooks';
import { useQuickActionsConfig } from '../../../shared/hooks/useFeatureConfig';



export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const name = user?.username ?? 'User';
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
    batchId,
    batchLoading,
    currentBatch,
    totalMoney,
    totalDeposit,
    isStartingBatch,
    isStoppingBatch,
    startBatch,
    stopBatch,
    finishTransfer,
    refreshBatch,
  } = useHomeBatch();

  // QuickActions configuration
  const {
    showDaftarNasabah,
    showSejarahBatch,
    showPengajuanPinjaman,
    showSimulasiKredit,
    showUKM,
    loadQuickActionsConfig,
  } = useQuickActionsConfig();

  // Load feature configuration on mount
  useEffect(() => {
    loadQuickActionsConfig();
  }, [loadQuickActionsConfig]);

  // Initial loading effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000); // 1 second loading

    return () => clearTimeout(timer);
  }, []);

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('[home] Refreshing data...');
      
      // Refresh both tracking and batch data
      await Promise.all([
        refreshTrackingStatus(),
        refreshBatch(),
        loadQuickActionsConfig(),
      ]);
      
      console.log('[home] Data refreshed successfully');
    } catch (error) {
      console.error('[home] Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshTrackingStatus, refreshBatch, loadQuickActionsConfig]);






  // Initialize tracking on focus
  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const initialize = async () => {
        if (!mounted) return;

        // Initialize global tracking if user is logged in
        if (user?.tenantId) {
          try {
            // console.log('[home] Preparing global tracking for tenant:', user.tenantId);
            
            // Debug tracking setup
            await debugTrackingSetup(user.tenantId);
            
            const trackingPrepared = await initializeGlobalTracking(user.tenantId);
            // console.log('[home] Global tracking prepared');
            
            // Only start tracking if it was successfully prepared (i.e., tracking is enabled)
            if (trackingPrepared) {
              // Start tracking after a delay to let user settle in
              setTimeout(async () => {
                if (mounted && user?.tenantId) {
                  try {
                    // console.log('[home] Starting global tracking...');
                    await startGlobalTracking(user.tenantId);
                    // console.log('[home] Global tracking started');
                  } catch (error) {
                    console.warn('[home] Failed to start global tracking:', error);
                  }
                }
              }, 3000); // 3 second delay
            } else {
              // console.log('[home] Tracking not enabled, skipping start tracking');
            }
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

  // Show loading screen during initial load
  if (initialLoading) {
    return (
      <SafeAreaView style={S.container} edges={['top', 'left', 'right']}>
        <AppBar title="Dots Corporate" />
        <View style={S.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={S.loadingText}>Memuat data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.container} edges={['top', 'left', 'right']}>
      <AppBar title="Dots Corporate" />

      <ScrollView 
        style={S.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Android
            tintColor={colors.primary} // iOS
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader username={name} />

        <BatchCardWrapper
          batchActive={batchActive}
          batchCode={batchCode}
          batchId={batchId}
          batchLoading={batchLoading}
          isStartingBatch={isStartingBatch}
          isStoppingBatch={isStoppingBatch}
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
          onGpsBadgePress={() => {
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
        showDaftarNasabah={showDaftarNasabah}
        showSejarahBatch={showSejarahBatch}
        showPengajuanPinjaman={showPengajuanPinjaman}
        showSimulasiKredit={showSimulasiKredit}
        showUKM={showUKM}
        onDaftarNasabah={() => {
          const parent = navigation.getParent?.();
          if (parent) parent.navigate('DaftarNasabah');
          else navigation.navigate('DaftarNasabah');
        }}
        onSejarahBatch={() => console.log('Sejarah Batch pressed')}
        onPengajuanPinjaman={() => console.log('Pengajuan Pinjaman pressed')}
        onSimulasiKredit={() => console.log('Simulasi Kredit pressed')}
        onUKM={() => console.log('UKM pressed')}
      />
      </ScrollView>
    </SafeAreaView>
  );
}



const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { 
    flex: 1,
    paddingHorizontal: spacing.xl, 
    paddingTop: spacing.xl, 
    gap: spacing.lg 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 16,
    fontFamily: typography.primary.medium,
  },
});