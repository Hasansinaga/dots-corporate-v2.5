import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { View, Text, StyleSheet } from "react-native"
import { colors, spacing, typography } from "../theme"

export default function NotificationScreen() {
  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <View style={S.content}>
        <Text style={S.title}>Notifikasi</Text>
        <Text style={S.subtitle}>Daftar notifikasi pengguna.</Text>
      </View>
    </SafeAreaView>
  )
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, justifyContent: "center" },
  title: { fontSize: 22, fontFamily: typography.primary.bold, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary },
})
