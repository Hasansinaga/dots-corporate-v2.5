import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

type Props = {
  max: number;
  selected: string[];
  onToggle: (value: string) => void;
};

const COLORS: Record<string, string> = {
  "1": "#4CAF50",
  "2": "#FFC107",
  "3": "#FF9800",
  "4": "#F44336",
  "5": "#B71C1C",
};

export const CollectibilityChips: React.FC<Props> = ({ max, selected, onToggle }) => {
  const items = Array.from({ length: Math.max(1, max) }, (_, i) => String(i + 1));
  return (
    <View style={S.wrap}>
      <Text style={S.label}>Kolektibilitas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={S.row}>
          {items.map((num) => {
            const active = selected.includes(num);
            return (
              <TouchableOpacity
                key={num}
                onPress={() => onToggle(num)}
                style={[S.chip, { backgroundColor: COLORS[num] }, active && S.chipActive]}
                activeOpacity={0.85}
              >
                <Text style={S.chipText}>{num}{active ? " ✓" : ""}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const S = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingBottom: 8, flexDirection: "row", alignItems: "center" },
  label: { color: "#6B7280", fontSize: 13, fontWeight: "700", marginRight: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  chip: {
    minWidth: 44, height: 32, paddingHorizontal: 10, borderRadius: 8,
    alignItems: "center", justifyContent: "center", marginRight: 6,
  },
  chipActive: { borderWidth: 1, borderColor: "#FFF" },
  chipText: { color: "#fff", fontSize: 12, fontWeight: "800" },
});
