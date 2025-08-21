// src/features/auth/screens/LoginScreen.tsx
import React from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import FontAwesome6 from "react-native-vector-icons/FontAwesome6"

import { colors } from "../../../theme"
import { ENV } from "../../../config/env"
import { useLoginForm } from "../hooks/useLoginForm"
import { useAuth } from "../../../stores/useAuth"

type ApiUser = { id?: string; name?: string; email?: string }
type SubmitOk = { ok?: true; user?: ApiUser } | { ok?: true; data?: { user?: ApiUser } }
type SubmitFail = { ok: false; message?: string }
type SubmitResult = SubmitOk | SubmitFail | null | undefined

const LoginScreen: React.FC = () => {
  const f = useLoginForm()
  const [showPassword, setShowPassword] = React.useState(false)
  const [localError, setLocalError] = React.useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const signIn = useAuth((s) => s.signIn)
  const navigation = useNavigation()

  const officeRef = React.useRef<TextInput>(null)
  const userRef = React.useRef<TextInput>(null)
  const passRef = React.useRef<TextInput>(null)

  const handleInputChange = (field: "officeCode" | "username" | "password", value: string) => {
    setLocalError(undefined)
    if ("setErrors" in f && typeof (f as any).setErrors === "function") {
      ;(f as any).setErrors({})
    }
    if (field === "officeCode") f.setKodeKantor(value)
    if (field === "username") f.setUsername(value)
    if (field === "password") f.setPassword(value)
  }

  const pushError = (msg: string) => {
    if ("setErrors" in f && typeof (f as any).setErrors === "function") {
      ;(f as any).setErrors({ ...((f as any).errors ?? {}), general: msg })
    } else {
      setLocalError(msg)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting || f.loading) return
    
    try {
      setIsSubmitting(true)
      setLocalError(undefined)

      const res: SubmitResult | any = await f.submit()
      
      if (res?.ok === false) {
        pushError(res?.message ?? "Login gagal. Periksa kembali data Anda.")
        return
      }

      // Jika berhasil, signIn untuk update auth state
      const cand = res?.user ?? res?.data?.user ?? null
      const user = {
        id: cand?.id ?? "local",
        name: cand?.name ?? f.username ?? "User",
        email: cand?.email ?? "",
      }

      signIn(user)

      // Navigation sudah dihandle di useLoginForm, tidak perlu timeout lagi
      console.log('[login] Login successful, navigation handled by useLoginForm')

    } catch (error: any) {
      console.error("[login] submit error:", error)
      pushError(error?.message || "Terjadi kesalahan saat login. Coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generalError = (f as any)?.errors?.general ?? localError
  const isLoading = f.loading || isSubmitting

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Image
                source={require("../../../assets/images/dots_logo.png")}
                style={{ width: 140, height: 140, resizeMode: "contain" }}
              />
            </View>

            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeTitle}>Selamat Datang</Text>
              <Text style={styles.welcomeSubtitle}>Masuk untuk melanjutkan</Text>
            </View>

            {!!generalError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            )}

            <View style={styles.formSection}>
              <FormInput
                ref={officeRef}
                icon={<FontAwesome6 name="building" size={18} color={colors.primary} />}
                placeholder="Kode Kantor (6 digit)"
                value={f.kodeKantor}
                onChangeText={(v) => handleInputChange("officeCode", v)}
                keyboardType="numeric"
                maxLength={6}
                returnKeyType="next"
                onSubmitEditing={() => userRef.current?.focus()}
                errorText={(f as any).errors?.kodeKantor}
                autoCapitalize="none"
                autoComplete="off"
                editable={!isLoading}
              />

              <FormInput
                ref={userRef}
                icon={<FontAwesome6 name="user" size={18} color={colors.primary} />}
                placeholder="Nama Pengguna"
                value={f.username}
                onChangeText={(v) => handleInputChange("username", v)}
                errorText={(f as any).errors?.username}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passRef.current?.focus()}
                autoComplete="username"
                textContentType="username"
                editable={!isLoading}
              />

              <FormInput
                ref={passRef}
                icon={<FontAwesome6 name="lock" size={18} color={colors.primary} />}
                placeholder="Kata Sandi"
                value={f.password}
                onChangeText={(v) => handleInputChange("password", v)}
                secureTextEntry={!showPassword}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setShowPassword((x) => !x)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    disabled={isLoading}
                  >
                    <FontAwesome6
                      name={showPassword ? "eye" : "eye-slash"}
                      size={18}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                }
                errorText={(f as any).errors?.password}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoComplete="password"
                textContentType="password"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? "Memuat…" : "Masuk"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.versionText}>
              Mobile Corporate Versi {ENV.VERSION_APP || "2.4.3"}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

interface FormInputProps {
  icon?: React.ReactNode
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secureTextEntry?: boolean
  keyboardType?: "default" | "numeric" | "email-address"
  maxLength?: number
  rightIcon?: React.ReactNode
  errorText?: string
  autoCapitalize?: "none" | "sentences" | "words" | "characters"
  autoCorrect?: boolean
  returnKeyType?: "done" | "next" | "go" | "search" | "send"
  onSubmitEditing?: () => void
  autoComplete?: React.ComponentProps<typeof TextInput>["autoComplete"]
  textContentType?: React.ComponentProps<typeof TextInput>["textContentType"]
  editable?: boolean
}

const FormInput = React.forwardRef<TextInput, FormInputProps>((props, ref) => {
  const {
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = "default",
    maxLength,
    rightIcon,
    errorText,
    autoCapitalize = "none",
    autoCorrect = false,
    returnKeyType = "done",
    onSubmitEditing,
    autoComplete,
    textContentType,
    editable = true,
  } = props

  return (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, !!errorText && styles.inputContainerError]}>
        <View style={styles.iconWrap}>{icon}</View>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          selectionColor={colors.primary}
          autoComplete={autoComplete}
          editable={editable}
          {...(Platform.OS === "ios" && textContentType ? { textContentType } : {})}
        />
        <View style={styles.rightIconWrap}>{rightIcon}</View>
      </View>
      {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  )
})

/** Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  welcomeSection: { alignItems: "center", marginBottom: 40 },
  welcomeTitle: { fontSize: 24, fontWeight: "bold", color: colors.primary, marginBottom: 8 },
  welcomeSubtitle: { fontSize: 16, color: colors.textSecondary },
  errorContainer: {
    backgroundColor: colors.error + "20",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: "100%",
  },
  formSection: { width: "100%", marginBottom: 30 },
  inputWrapper: { marginBottom: 16 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputContainerError: { borderColor: colors.error },
  iconWrap: { width: 28, alignItems: "center", marginRight: 6 },
  rightIconWrap: { minWidth: 28, alignItems: "center", marginLeft: 6 },
  input: { flex: 1, fontSize: 16, color: colors.text },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonDisabled: { backgroundColor: colors.textTertiary },
  loginButtonText: { color: colors.background, fontSize: 18, fontWeight: "bold" },
  versionText: { fontSize: 14, color: colors.textTertiary, textAlign: "center" },
  errorText: { fontSize: 12, color: colors.error, marginTop: 4, marginLeft: 4 },
})

export default LoginScreen