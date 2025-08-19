import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { View, Text, StyleSheet } from "react-native"
import { colors, spacing, typography } from "../theme"

export default function QRScannerScreen() {
  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <View style={S.content}>
        <Text style={S.title}>QR Scanner</Text>
        <Text style={S.subtitle}>Tempatkan kode QR di dalam area pemindaian.</Text>
        <View style={S.scannerMock} />
      </View>
    </SafeAreaView>
  )
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, padding: spacing.xl, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontFamily: typography.primary.bold, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xl },
  scannerMock: {
    width: "80%",
    height: 220,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
})
