import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QrCode } from "lucide-react-native";
import { colors } from "../../theme";
import { useNavigationState, useNavigation } from "@react-navigation/native";

export function GlobalNavButton() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const currentRoute = useNavigationState((s) => s.routes[s.index]?.name);

  const hiddenOn = new Set(["Login", "Scan"]);
  if (currentRoute && hiddenOn.has(currentRoute)) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate("Scan" as never)}
      style={[styles.fab, { bottom: insets.bottom + 24 }]}
    >
              <QrCode size={22} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    alignSelf: "center",
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryColor,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default GlobalNavButton;
