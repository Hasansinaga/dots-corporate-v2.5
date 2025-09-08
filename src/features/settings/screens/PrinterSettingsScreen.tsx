import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Alert, ScrollView, Switch } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";
import AppBar from "../../../shared/components/AppBar";
import CustomInput from "../../../shared/components/CustomInput";
import CustomButton from "../../../shared/components/CustomButton";

export default function PrinterSettingsScreen() {
  const navigation = useNavigation();
  const [printerName, setPrinterName] = useState("");
  const [printerIP, setPrinterIP] = useState("");
  const [printerPort, setPrinterPort] = useState("9100");
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    if (!printerName.trim()) {
      Alert.alert("Error", "Nama printer harus diisi");
      return;
    }

    if (!printerIP.trim()) {
      Alert.alert("Error", "IP Address printer harus diisi");
      return;
    }

    // Validasi IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(printerIP)) {
      Alert.alert("Error", "Format IP Address tidak valid");
      return;
    }

    try {
      setIsLoading(true);
      
      // TODO: Implementasi API call untuk save printer settings
      // await printerService.saveSettings({ printerName, printerIP, printerPort, isEnabled });
      
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        "Berhasil",
        "Pengaturan printer berhasil disimpan",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("[printer-settings] Error:", error);
      Alert.alert("Error", "Gagal menyimpan pengaturan printer. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!printerIP.trim()) {
      Alert.alert("Error", "IP Address printer harus diisi terlebih dahulu");
      return;
    }

    try {
      setIsLoading(true);
      
      // TODO: Implementasi test connection
      // await printerService.testConnection(printerIP, printerPort);
      
      // Simulasi test connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert("Berhasil", "Koneksi ke printer berhasil!");
    } catch (error) {
      console.error("[printer-test] Error:", error);
      Alert.alert("Error", "Gagal terhubung ke printer. Periksa IP Address dan koneksi jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = printerName.trim() && printerIP.trim() && printerPort.trim();

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <AppBar title="Setting Printer" showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={S.content} showsVerticalScrollIndicator={false}>
        <View style={S.header}>
          <Text style={S.title}>Pengaturan Printer</Text>
          <Text style={S.subtitle}>
            Konfigurasi printer untuk mencetak dokumen dan laporan
          </Text>
        </View>

        <View style={S.section}>
          <View style={S.switchContainer}>
            <View style={S.switchLabel}>
              <Text style={S.switchTitle}>Aktifkan Printer</Text>
              <Text style={S.switchSubtitle}>Gunakan printer untuk mencetak dokumen</Text>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isEnabled ? colors.background : colors.textTertiary}
            />
          </View>
        </View>

        {isEnabled && (
          <View style={S.form}>
            <View style={S.inputContainer}>
              <Text style={S.inputLabel}>Nama Printer</Text>
              <CustomInput
                placeholder="Masukkan nama printer"
                value={printerName}
                onChangeText={setPrinterName}
                autoCapitalize="words"
              />
            </View>

            <View style={S.inputContainer}>
              <Text style={S.inputLabel}>IP Address</Text>
              <CustomInput
                placeholder="192.168.1.100"
                value={printerIP}
                onChangeText={setPrinterIP}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <View style={S.inputContainer}>
              <Text style={S.inputLabel}>Port</Text>
              <CustomInput
                placeholder="9100"
                value={printerPort}
                onChangeText={setPrinterPort}
                keyboardType="numeric"
                autoCapitalize="none"
              />
            </View>

            <View style={S.buttonContainer}>
              <CustomButton
                title="Test Koneksi"
                onPress={handleTestConnection}
                disabled={!printerIP.trim() || isLoading}
                style={S.secondaryButton}
              />
            </View>

            <View style={S.buttonContainer}>
              <CustomButton
                title={isLoading ? "Menyimpan..." : "Simpan Pengaturan"}
                onPress={handleSaveSettings}
                disabled={!isFormValid || isLoading}
                style={!isFormValid || isLoading ? S.disabledButton : S.primaryButton}
              />
            </View>
          </View>
        )}

        <View style={S.info}>
          <Text style={S.infoTitle}>Informasi Printer:</Text>
          <Text style={S.infoText}>• Pastikan printer terhubung ke jaringan yang sama</Text>
          <Text style={S.infoText}>• IP Address printer dapat dilihat di menu printer</Text>
          <Text style={S.infoText}>• Port default untuk printer network adalah 9100</Text>
          <Text style={S.infoText}>• Test koneksi untuk memastikan printer dapat diakses</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  content: { 
    flex: 1, 
    padding: spacing.xl 
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: { 
    fontSize: 24, 
    fontFamily: typography.primary.bold, 
    color: colors.text, 
    marginBottom: spacing.sm 
  },
  subtitle: { 
    fontSize: 16, 
    color: colors.textSecondary, 
    lineHeight: 22 
  },
  section: {
    marginBottom: spacing.xl,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: {
    flex: 1,
    marginRight: spacing.md,
  },
  switchTitle: {
    fontSize: 16,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  switchSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  form: {
    marginBottom: spacing.xl,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.textSecondary,
  },
  disabledButton: {
    backgroundColor: colors.textTertiary,
  },
  info: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
});
