import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, StyleSheet, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing, typography } from "../../../theme";
import { useAuth } from "../../../stores/useAuth";
import { useBatch } from "../../../stores/useBatch";
import AppBar from "../../../shared/components/AppBar";
import CustomButton from "../../../shared/components/CustomButton";

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { hasActiveBatch } = useBatch();

  const doLogoutNow = async () => {
    try {
      await signOut();
      console.log("[settings] Logout completed");
    } catch (error) {
      console.error("[settings] Logout error:", error);
      // Force navigation reset even if logout fails
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" as never }],
      });
    }
  };

  const onLogout = () => {
    Alert.alert(
      "Keluar Akun",
      "Apakah Anda yakin ingin keluar dari aplikasi?",
      [
        { text: "Batal", style: "cancel" },
        { text: "Keluar", style: "destructive", onPress: doLogoutNow },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView style={S.container} edges={["top", "left", "right"]}>
      <AppBar title="Pengaturan" />
      
      <ScrollView 
        style={S.content} 
        contentContainerStyle={S.scrollContent}
        showsVerticalScrollIndicator={false}
      > 

        <View style={S.section}> 
          
          <View style={S.buttonContainer}>
            <CustomButton
              title="Ganti Password"
              onPress={() => navigation.navigate('ChangePassword' as never)}
              style={S.primaryButton}
            />
          </View>
        </View>

        <View style={S.section}> 
          
          <View style={S.buttonContainer}>
            <CustomButton
              title="Setting Printer"
              onPress={() => navigation.navigate('PrinterSettings' as never)}
              style={S.primaryButton}
            />
          </View>
        </View> 
      </ScrollView>

      {/* Fixed Logout Button at Bottom */}
      <View style={S.fixedLogoutContainer}>
        <CustomButton
          title="Keluar Akun"
          onPress={onLogout}
          disabled={hasActiveBatch}
          style={hasActiveBatch ? S.disabledButton : S.logoutButton}
        />
        
        {hasActiveBatch && (
          <Text style={S.disabledText}>
            Tidak dapat keluar saat batch sedang aktif. Hentikan batch terlebih dahulu.
          </Text>
        )}
      </View>
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
  },
  scrollContent: {
    padding: spacing.xl,
    paddingBottom: 100, // Space for fixed logout button
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
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.primary.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  buttonContainer: {
    marginBottom: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  logoutButton: {
    backgroundColor: colors.error,
  },
  disabledButton: {
    backgroundColor: colors.textTertiary,
  },
  logoutSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  fixedLogoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingBottom: spacing.xl + 20, // Extra padding for safe area
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  infoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.primary.medium,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontFamily: typography.primary.medium,
  },
  activeStatus: {
    color: colors.success,
    fontFamily: typography.primary.bold,
  },
  inactiveStatus: {
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
