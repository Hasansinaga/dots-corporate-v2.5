import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import {
  Users,
  History,
  FileText,
  Calculator,
  Briefcase,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const SIDE = spacing?.xl ?? 20;
const GAP = spacing?.md ?? 12;
const ITEM_W = (width - SIDE * 2 - GAP * 3) / 4;

type QuickActionProps = {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
};

const QuickAction: React.FC<QuickActionProps> = ({ label, onPress, icon }) => (
  <Pressable
    style={S.quick}
    onPress={onPress}
    android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
  >
    <View style={S.quickIconWrap}>{icon}</View>
    <Text style={S.quickLabel} numberOfLines={2} ellipsizeMode="clip">
      {label}
    </Text>
  </Pressable>
);

interface QuickActionsProps {
  onDaftarNasabah: () => void;
  onSejarahBatch: () => void;
  onPengajuanPinjaman: () => void;
  onSimulasiKredit: () => void;
  onUKM: () => void;
  // Feature configuration
  showDaftarNasabah?: boolean;
  showSejarahBatch?: boolean;
  showPengajuanPinjaman?: boolean;
  showSimulasiKredit?: boolean;
  showUKM?: boolean;
}

export default function QuickActions({
  onDaftarNasabah,
  onSejarahBatch,
  onPengajuanPinjaman,
  onSimulasiKredit,
  onUKM,
  showDaftarNasabah = false,
  showSejarahBatch = false,
  showPengajuanPinjaman = false,
  showSimulasiKredit = false,
  showUKM = false,
}: QuickActionsProps) {
  const allActions = [
    {
      id: 'daftar-nasabah',
      label: 'Daftar Nasabah',
      onPress: onDaftarNasabah,
      icon: <Users size={22} color={colors.primary} />,
      enabled: showDaftarNasabah,
    },
    {
      id: 'sejarah-batch',
      label: 'Sejarah Batch',
      onPress: onSejarahBatch,
      icon: <History size={22} color={colors.primary} />,
      enabled: showSejarahBatch,
    },
    {
      id: 'pengajuan-pinjaman',
      label: 'Pengajuan\nPinjaman',
      onPress: onPengajuanPinjaman,
      icon: <FileText size={22} color={colors.primary} />,
      enabled: showPengajuanPinjaman,
    },
    {
      id: 'simulasi-kredit',
      label: 'Simulasi Kredit',
      onPress: onSimulasiKredit,
      icon: <Calculator size={22} color={colors.primary} />,
      enabled: showSimulasiKredit,
    },
    {
      id: 'ukm',
      label: 'UKM',
      onPress: onUKM,
      icon: <Briefcase size={22} color={colors.primary} />,
      enabled: showUKM,
    },
  ];

  // Filter only enabled actions
  const enabledActions = allActions.filter(action => action.enabled);

  // If no actions are enabled, don't render anything
  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <View style={S.quickRow}>
      {enabledActions.map((action) => (
        <QuickAction 
          key={action.id} 
          label={action.label}
          onPress={action.onPress}
          icon={action.icon}
        />
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  quickRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quick: { 
    width: ITEM_W, 
    alignItems: 'center', 
    marginBottom: spacing.md 
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE8FF',
    marginBottom: spacing.sm,
  },
  quickLabel: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    fontFamily: typography.primary.regular,
  },
});
