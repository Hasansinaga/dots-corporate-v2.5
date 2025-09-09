import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";
import AppBar from "../../../shared/components/AppBar";
import CustomButton from "../../../shared/components/CustomButton";
import { BluetoothEscposPrinter } from "@brooons/react-native-bluetooth-escpos-printer";
import { PrintSettingsService, PrintSettings } from "../services/printSettingsService";
import { bluetoothConnectionService } from "../services/bluetoothConnectionService";
import BankReceiptService from "../services/bankReceiptService";
import BankReceiptPreview from "../components/BankReceiptPreview";

interface RouteParams {
  device: {
    name: string;
    address: string;
  };
}

function PrintSettingsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { device } = route.params as RouteParams;
  
  // Get device from service as fallback
  const connectedDevice = bluetoothConnectionService.getConnectedDevice();
  const currentDevice = device || connectedDevice;

  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    alignment: BluetoothEscposPrinter.ALIGN.CENTER,
    fontSize: 16,
    fontType: 1,
    widthTimes: 0,
    heightTimes: 0,
  });

  const sizeOptions = [
    { label: "0x (Default)", value: 0 },
    { label: "1x (Sedikit Besar)", value: 1 },
    { label: "2x (Besar)", value: 2 },
  ];

  useEffect(() => {
    loadSavedSettings();
  }, []);

  const loadSavedSettings = async () => {
    try {
      const savedSettings = await PrintSettingsService.loadSettings();
      if (savedSettings) {
        setPrintSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading print settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await PrintSettingsService.saveSettings(printSettings);
      Alert.alert("Berhasil", "Pengaturan print berhasil disimpan");
    } catch (error) {
      console.error('Error saving print settings:', error);
      Alert.alert("Error", "Gagal menyimpan pengaturan print");
    }
  };

  const handleTestPrint = async () => {
    try {
      console.log("[test-print] Current printSettings:", printSettings);
      const sampleData = BankReceiptService.getSampleData();
      await BankReceiptService.printBankReceipt(sampleData, printSettings);
      Alert.alert("Berhasil", "Test print struk bank berhasil dikirim ke printer");
    } catch (error) {
      console.error("[test-print] Error:", error);
      let errorMessage = "Gagal mengirim test print ke printer";
      if (error instanceof Error) {
        if (error.message.includes('tidak tersedia')) {
          errorMessage = "Library Bluetooth Printer belum ter-link dengan benar. Silakan rebuild aplikasi.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      Alert.alert("Error", errorMessage);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = PrintSettingsService.getDefaultSettings();
    setPrintSettings(defaultSettings);
    Alert.alert("Info", "Pengaturan telah direset ke default");
  };

  const renderOptionGroup = (
    title: string,
    options: Array<{ label: string; value: any }>,
    currentValue: any,
    onSelect: (value: any) => void
  ) => (
    <View style={S.settingGroup}>
      <Text style={S.settingTitle}>{title}</Text>
      <View style={S.buttonGroup}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              S.optionButton,
              currentValue === option.value && S.selectedOption
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              S.optionText,
              currentValue === option.value && S.selectedOptionText
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <AppBar 
        title="Pengaturan Print" 
        showBackButton 
        onBackPress={() => navigation.goBack()} 
      />
      
      <ScrollView style={S.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Pengaturan Print</Text>
          <Text style={S.subtitle}>Konfigurasi pengaturan printer untuk hasil print yang optimal</Text>
          {currentDevice && (
            <View style={S.deviceInfo}>
              <View style={S.deviceIcon}>
                <Text style={S.deviceIconText}>🖨️</Text>
              </View>
              <View style={S.deviceDetails}>
                <Text style={S.deviceName}>{currentDevice.name}</Text>
                <Text style={S.deviceAddress}>{currentDevice.address}</Text>
                <Text style={S.deviceStatus}>● Terhubung</Text>
              </View>
            </View>
          )}
        </View>

        {/* Settings */}
        <View style={S.settingsContainer}>
          {renderOptionGroup(
            "Width Times (Lebar Font):",
            sizeOptions,
            printSettings.widthTimes,
            (value) => setPrintSettings({ ...printSettings, widthTimes: value })
          )}

          {renderOptionGroup(
            "Height Times (Tinggi Font):",
            sizeOptions,
            printSettings.heightTimes,
            (value) => setPrintSettings({ ...printSettings, heightTimes: value })
          )}
        </View>

        {/* Preview Section */}
        <View style={S.previewContainer}>
          <Text style={S.previewTitle}>Preview Struk Bank:</Text>
          <BankReceiptPreview
            data={BankReceiptService.getSampleData()}
            fontSize={12}
            bankNameSize={printSettings.widthTimes === 0 ? 12 : 12 * printSettings.widthTimes}
            receiptTypeSize={printSettings.widthTimes === 0 ? 12 : 12 * printSettings.widthTimes}
            transactionIdSize={printSettings.widthTimes === 0 ? 10 : 10 * printSettings.widthTimes}
            disclaimerSize={printSettings.widthTimes === 0 ? 8 : 8 * printSettings.widthTimes}
            qrCodeSize={printSettings.widthTimes === 0 ? 12 : 12 * printSettings.widthTimes}
            labelWidth={15}
            showCurrency={true}
            showQRCode={true}
            maxWidth={280}
          />
        </View>

        {/* Action Buttons */}
        <View style={S.actionButtons}>
          <CustomButton
            title="Test Print"
            onPress={handleTestPrint}
            style={S.testButton}
          />
          <CustomButton
            title="Simpan Pengaturan"
            onPress={saveSettings}
            style={S.saveButton}
          />
          <CustomButton
            title="Reset Settings"
            onPress={handleResetSettings}
            style={S.resetButton}
          />
        </View>
        
        {/* Extra padding for scroll */}
        <View style={S.scrollPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: typography.primary.regular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  deviceInfo: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  deviceIcon: {
    width: 50,
    height: 50,
    backgroundColor: colors.primaryLight,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deviceAddress: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.primary.regular,
    marginBottom: spacing.xs,
  },
  deviceStatus: {
    fontSize: 12,
    color: colors.success,
    fontFamily: typography.primary.medium,
  },
  settingsContainer: {
    flex: 1,
  },
  settingGroup: {
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: 80,
    alignItems: 'center',
    elevation: 1,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 2,
  },
  optionText: {
    fontSize: 14,
    fontFamily: typography.primary.medium,
    color: colors.text,
  },
  selectedOptionText: {
    color: colors.background,
  },
  actionButtons: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  testButton: {
    backgroundColor: colors.success,
    marginBottom: spacing.md,
    borderRadius: 8,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
    borderRadius: 8,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: colors.error,
    borderRadius: 8,
    elevation: 2,
  },
  scrollPadding: {
    height: spacing.xl,
  },
  previewContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewTitle: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default PrintSettingsScreen;
