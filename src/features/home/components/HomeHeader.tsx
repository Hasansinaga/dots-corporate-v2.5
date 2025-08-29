import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../theme';

const greet = (h: number) =>
  h < 11
    ? 'Selamat pagi'
    : h < 15
    ? 'Selamat siang'
    : h < 19
    ? 'Selamat sore'
    : 'Selamat malam';

const indoDate = (d: Date) => {
  const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][
    d.getDay()
  ];
  const bulan = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ][d.getMonth()];
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${hari}, ${d.getDate()} ${bulan} ${d.getFullYear()} | ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

interface HomeHeaderProps {
  username: string;
}

export default function HomeHeader({ username }: HomeHeaderProps) {
  const now = useMemo(() => new Date(), []);
  const greetText = `${greet(now.getHours())}, ${username}`;
  const dateText = indoDate(now);

  return (
    <View style={S.header}>
      <Text style={S.greet}>{greetText}</Text>
      <Text style={S.date}>{dateText}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  header: { marginBottom: spacing.xs },
  greet: {
    color: colors.text,
    fontSize: 20,
    fontFamily: typography.primary.bold,
  },
  date: { 
    color: colors.textSecondary, 
    marginTop: spacing.xs, 
    fontSize: 12 
  },
});
