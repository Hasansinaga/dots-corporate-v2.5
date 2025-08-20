import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";

export default function DemoDebugScreen() {
  const navigation = useNavigation();

  const doLogoutNow = async () => {
    try {
      await AsyncStorage.multiRemove([
        "authToken",
        "kodeKantor",
        "userId",
        "trxBatchId",
        "activeBatchData",
      ]);
    } catch (e) {
      console.warn("Failed clearing storage:", e);
    } finally {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
    }
  };

  const onLogout = () => {
    Alert.alert(
      "Keluar akun?",
      "Kamu akan keluar dari aplikasi.",
      [
        { text: "Batal", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: doLogoutNow },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <View style={S.content}>
        <Text style={S.title}>Pengaturan</Text>
        <Text style={S.subtitle}>Pengaturan & debug tools.</Text>

        <Pressable style={S.logoutBtn} onPress={onLogout} android_ripple={{ color: "rgba(255,255,255,0.2)" }}>
          <Text style={S.logoutText}>Logout</Text>
        </Pressable>

        <Text style={S.meta}>Versi Aplikasi 1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 22, fontFamily: typography.primary.bold, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
  logoutBtn: { backgroundColor: "#EF4444", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 16, fontFamily: typography.primary.bold, letterSpacing: 0.2 },
  meta: { marginTop: spacing.md, color: colors.textSecondary, fontSize: 12, textAlign: "center" },
});
