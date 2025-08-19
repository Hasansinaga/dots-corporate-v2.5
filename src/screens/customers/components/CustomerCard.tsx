import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

type Props = {
  item: any;                  // { fullName, address, cif, productName, balanceFmt? }
  rightTop?: React.ReactNode; // badge coll (opsional)
  onPress?: () => void;
};

export const CustomerCard: React.FC<Props> = ({ item, rightTop, onPress }) => {
  return (
    <TouchableOpacity style={S.card} activeOpacity={0.9} onPress={onPress}>
      <View style={S.row}>
        <View style={S.left}>
          <Text style={S.name} numberOfLines={1}>
            {item.fullName || item.full_name || "—"}
          </Text>

          {!!item.address && <Text style={S.addr} numberOfLines={2}>{item.address}</Text>}

          {!!item.productName && (
            <Text style={S.product} numberOfLines={1}>{item.productName}</Text>
          )}

          {!!item.balanceFmt && (
            <Text style={S.balance} numberOfLines={1}>Baki Debet: {item.balanceFmt}</Text>
          )}
        </View>

        <View style={S.right}>
          {rightTop}
          {!!item.cif && <Text style={S.cif}>{item.cif}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const S = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  left: { flex: 1, paddingRight: 12 },
  right: { alignItems: "flex-end", minWidth: 72 },
  name: { color: "#111827", fontSize: 15, fontWeight: "800" },
  addr: { color: "#6B7280", fontSize: 12, marginTop: 2, lineHeight: 18 },
  product: { color: "#0E73E3", marginTop: 6, fontWeight: "700", fontSize: 12 },
  balance: { color: "#0E73E3", fontWeight: "800", fontSize: 12, marginTop: 4 },
  cif: { marginTop: 6, color: "#111827", fontSize: 12, fontWeight: "700" },
});
