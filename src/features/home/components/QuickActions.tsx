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
}

export default function QuickActions({
  onDaftarNasabah,
  onSejarahBatch,
  onPengajuanPinjaman,
  onSimulasiKredit,
  onUKM,
}: QuickActionsProps) {
  const actions: QuickActionProps[] = [
    {
      label: 'Daftar Nasabah',
      onPress: onDaftarNasabah,
      icon: <Users size={22} color={colors.primary} />,
    },
    {
      label: 'Sejarah Batch',
      onPress: onSejarahBatch,
      icon: <History size={22} color={colors.primary} />,
    },
    {
      label: 'Pengajuan\nPinjaman',
      onPress: onPengajuanPinjaman,
      icon: <FileText size={22} color={colors.primary} />,
    },
    {
      label: 'Simulasi Kredit',
      onPress: onSimulasiKredit,
      icon: <Calculator size={22} color={colors.primary} />,
    },
    {
      label: 'UKM',
      onPress: onUKM,
      icon: <Briefcase size={22} color={colors.primary} />,
    },
  ];

  return (
    <View style={S.quickRow}>
      {actions.map((a, i) => (
        <QuickAction key={i} {...a} />
      ))}
    </View>
  );
}

const S = StyleSheet.create({
  quickRow: {
    marginTop: spacing.xs,
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
