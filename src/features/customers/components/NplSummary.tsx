import React from "react";
import { View, Text, StyleSheet } from "react-native";

type Props = { amount: number; percentage: number };

export const NplSummary: React.FC<Props> = ({ amount, percentage }) => {
  const fmtIDR = (x: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(x || 0);

  return (
    <View style={S.card}>
      <View style={S.row}>
        <Text style={S.label}>Jumlah NPL</Text>
        <Text style={S.value}>{fmtIDR(amount)}</Text>
      </View>
      <View style={S.divider} />
      <View style={S.row}>
        <Text style={S.label}>Persentase NPL</Text>
        <Text style={S.value}>{(percentage ?? 0).toString()}%</Text>
      </View>
    </View>
  );
};

const S = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: "#6B7280", fontSize: 13, fontWeight: "700" },
  value: { color: "#0E73E3", fontSize: 14, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 8 },
});
