import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

const formatIDR = (n: number) =>
  'Rp ' + (Math.floor(n) + '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

interface BatchCardProps {
  batchActive: boolean;
  batchCode: string | null;
  totalMoney: number;
  totalDeposit: number;
  locationRequired: boolean;
  trackingActive: boolean;
  gpsEnabled: boolean | null;
  gpsMonitoringActive: boolean;
  onStartBatch: () => void;
  onStopBatch: () => void;
  onFinishTransfer: () => void;
  onTrackingBadgePress: () => void;
  _onGpsBadgePress: () => void;
  onForceLocationCheck: () => Promise<boolean>;
}

export default function BatchCard({
  batchActive,
  batchCode,
  totalMoney,
  totalDeposit,
  locationRequired,
  trackingActive,
  gpsEnabled,
  gpsMonitoringActive,
  onStartBatch,
  onStopBatch,
  onFinishTransfer,
  onTrackingBadgePress,
  _onGpsBadgePress,
  onForceLocationCheck,
}: BatchCardProps) {
  // Function to get GPS badge status and color
  const getGpsBadgeInfo = () => {
    if (!locationRequired) return null;
    
    if (gpsEnabled === null) {
      return { text: 'Memeriksa...', style: S.badgeWarning };
    } else if (gpsEnabled === false) {
      return { text: 'GPS Mati', style: S.badgeError };
    } else {
      return { text: 'GPS Aktif', style: S.badgeActive };
    }
  };

  const gpsBadgeInfo = getGpsBadgeInfo();

  return (
    <View style={S.card}>
      <View style={S.row}>
        <Text style={S.cardLabel}>Batch</Text>
        <Text style={S.cardValue}>{batchActive ? batchCode : '—'}</Text>
      </View>

      <View style={[S.row, { marginTop: 6 }]}>
        <Text style={S.cardLabel}>Status</Text>
        <Text
          style={[S.badge, batchActive ? S.badgeActive : S.badgeInactive]}
        >
          {batchActive ? 'Active' : 'Inactive'}
        </Text>
      </View>

      {/* Badge status tracking - show only if location is required */}
      {locationRequired && (
        <Pressable
          style={[S.row, { marginTop: 6 }]}
          onPress={onTrackingBadgePress}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          <Text style={S.cardLabel}>Tracking Lokasi</Text>
          <Text
            style={[
              S.badge,
              trackingActive ? S.badgeActive : S.badgeWarning,
            ]}
          >
            {trackingActive ? 'Aktif' : 'Nonaktif'}
          </Text>
        </Pressable>
      )}

      {/* GPS Status Badge - show only if location is required */}
      {locationRequired && gpsBadgeInfo && (
        <Pressable
          style={[S.row, { marginTop: 6 }]}
          onPress={() => {
            Alert.alert(
              'Status GPS',
              `GPS saat ini ${gpsEnabled === true ? 'aktif' : gpsEnabled === false ? 'tidak aktif' : 'sedang diperiksa'}.\n\nMonitoring GPS: ${gpsMonitoringActive ? 'Berjalan setiap 1 menit' : 'Tidak aktif'}`,
              [
                {
                  text: 'Periksa Sekarang',
                  onPress: async () => {
                    const status = await onForceLocationCheck();
                    Alert.alert('Hasil Pemeriksaan', `GPS saat ini ${status ? 'aktif' : 'tidak aktif'}.`);
                  },
                },
                { text: 'OK' },
              ],
            );
          }}
          android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        >
          <Text style={S.cardLabel}>Status GPS</Text>
          <Text style={[S.badge, gpsBadgeInfo.style]}>
            {gpsBadgeInfo.text}
          </Text>
        </Pressable>
      )}

      <View style={S.statsWrap}>
        <View style={S.stat}>
          <Text style={S.statLabel}>Jumlah Uang</Text>
          <Text style={S.statValue}>{formatIDR(totalMoney)}</Text>
        </View>
        <View style={S.dividerV} />
        <View style={S.stat}>
          <Text style={S.statLabel}>Total Setoran</Text>
          <Text style={S.statValue}>{totalDeposit}</Text>
        </View>
      </View>

      {!batchActive ? (
        <Pressable
          style={S.cta}
          onPress={onStartBatch}
          android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
        >
          <Text style={S.ctaText}>Mulai Batch</Text>
        </Pressable>
      ) : (
        <View style={S.ctaBar}>
          <Pressable
            style={[S.ctaHalf, S.ctaGhost]}
            onPress={onFinishTransfer}
            android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
          >
            <Text style={S.ctaGhostText}>Selesai transfer</Text>
          </Pressable>
          <View style={S.dividerH} />
          <Pressable
            style={S.ctaHalf}
            onPress={onStopBatch}
            android_ripple={{ color: 'rgba(255,255,255,0.15)' }}
          >
            <Text style={S.ctaText}>Hentikan batch</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: colors.inputBackground,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLabel: { 
    color: colors.textSecondary, 
    fontSize: 12 
  },
  cardValue: {
    color: colors.text,
    fontSize: 14,
    fontFamily: typography.primary.medium,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontSize: 12,
    overflow: 'hidden',
  },
  badgeInactive: { 
    color: colors.warning, 
    backgroundColor: '#FEF3C7' 
  },
  badgeActive: { 
    color: colors.success, 
    backgroundColor: '#D1FAE5' 
  },
  badgeWarning: { 
    color: colors.error, 
    backgroundColor: '#FEE2E2' 
  },
  badgeError: { 
    color: colors.error, 
    backgroundColor: '#FECACA' 
  },
  statsWrap: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.background,
    borderRadius: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  statLabel: { 
    color: colors.textSecondary, 
    fontSize: 12, 
    marginBottom: spacing.xs 
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontFamily: typography.primary.bold,
  },
  dividerV: { 
    width: 1, 
    backgroundColor: colors.border 
  },
  cta: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: spacing.md,
    alignItems: 'center',
    elevation: 2,
  },
  ctaText: {
    color: colors.background,
    fontSize: 15,
    fontFamily: typography.primary.bold,
    letterSpacing: 0.2,
  },
  ctaBar: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderRadius: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaHalf: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  ctaGhost: { 
    backgroundColor: colors.background 
  },
  ctaGhostText: {
    color: colors.text,
    fontSize: 15,
    fontFamily: typography.primary.medium,
  },
  dividerH: { 
    width: 1, 
    backgroundColor: colors.border 
  },
});
