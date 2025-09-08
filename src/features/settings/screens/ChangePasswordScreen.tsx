import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";
import AppBar from "../../../shared/components/AppBar";
import CustomInput from "../../../shared/components/CustomInput";
import CustomButton from "../../../shared/components/CustomButton";

export default function ChangePasswordScreen() {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validasi input
    if (!currentPassword.trim()) {
      Alert.alert("Error", "Password lama harus diisi");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Error", "Password baru harus diisi");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password baru minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Konfirmasi password tidak sama");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "Password baru harus berbeda dengan password lama");
      return;
    }

    try {
      setIsLoading(true);
      
      // TODO: Implementasi API call untuk ganti password
      // await authService.changePassword(currentPassword, newPassword);
      
      // Simulasi loading
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        "Berhasil",
        "Password berhasil diubah",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error("[change-password] Error:", error);
      Alert.alert("Error", "Gagal mengubah password. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = currentPassword.trim() && 
                     newPassword.trim() && 
                     confirmPassword.trim() && 
                     newPassword === confirmPassword &&
                     newPassword.length >= 6 &&
                     currentPassword !== newPassword;

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <AppBar title="Ganti Password" showBackButton onBackPress={() => navigation.goBack()} />
      
      <ScrollView style={S.content} showsVerticalScrollIndicator={false}>
        <View style={S.header}>
          <Text style={S.title}>Ganti Password</Text>
          <Text style={S.subtitle}>
            Masukkan password lama dan password baru untuk mengubah password akun Anda
          </Text>
        </View>

        <View style={S.form}>
          <View style={S.inputContainer}>
            <Text style={S.inputLabel}>Password Lama</Text>
            <CustomInput
              placeholder="Masukkan password lama"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={S.inputContainer}>
            <Text style={S.inputLabel}>Password Baru</Text>
            <CustomInput
              placeholder="Masukkan password baru (min. 6 karakter)"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={S.inputContainer}>
            <Text style={S.inputLabel}>Konfirmasi Password Baru</Text>
            <CustomInput
              placeholder="Konfirmasi password baru"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={S.buttonContainer}>
            <CustomButton
              title={isLoading ? "Mengubah..." : "Ubah Password"}
              onPress={handleChangePassword}
              disabled={!isFormValid || isLoading}
              style={!isFormValid || isLoading ? S.disabledButton : S.primaryButton}
            />
          </View>
        </View>

        <View style={S.info}>
          <Text style={S.infoTitle}>Tips Password yang Aman:</Text>
          <Text style={S.infoText}>• Minimal 6 karakter</Text>
          <Text style={S.infoText}>• Kombinasi huruf dan angka</Text>
          <Text style={S.infoText}>• Hindari informasi pribadi</Text>
          <Text style={S.infoText}>• Jangan bagikan password dengan siapapun</Text>
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
    marginTop: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
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
