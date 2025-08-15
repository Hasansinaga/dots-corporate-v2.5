import { useEffect } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View, Text, TouchableOpacity } from "react-native"
import { CustomInput } from "../../shared/components/CustomInput"
import { CustomButton } from "../../shared/components/CustomButton"
import { Logo } from "../../shared/components/Logo"
import { colors } from "../../shared/constants/colors"
import { useLoginForm } from "../hooks/useLoginForm"

export default function LoginScreen() {
  const f = useLoginForm()

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center" }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: "center", marginBottom: 24 }}>
          <Logo width={180} height={120} />
          <Text style={{ color: colors.primary, fontSize: 26, fontWeight: "700", marginTop: 8 }}>Selamat Datang</Text>
          <Text style={{ color: "#666" }}>Masuk untuk melanjutkan</Text>
        </View>

        {f.errors.general ? (
          <Text style={{ backgroundColor: "#ffe6e6", color: "#c00", padding: 10, borderRadius: 8, marginBottom: 12, textAlign: "center" }}>{f.errors.general}</Text>
        ) : null}

        <CustomInput
          label="Kode Kantor"
          placeholder="6 digit"
          keyboardType="number-pad"
          value={f.kodeKantor}
          onChangeText={f.setKodeKantor}
          errorText={f.errors.kodeKantor}
          maxLength={6}
        />

        <CustomInput
          label="Nama Pengguna"
          placeholder="username"
          autoCapitalize="none"
          value={f.username}
          onChangeText={f.setUsername}
          errorText={f.errors.username}
        />

        <CustomInput
          label="Kata Sandi"
          placeholder="••••••••"
          autoCapitalize="none"
          secureTextEntry={!f.showPassword}
          value={f.password}
          onChangeText={f.setPassword}
          errorText={f.errors.password}
          rightComponent={
            <TouchableOpacity onPress={() => f.setShowPassword(!f.showPassword)}>
              <Text style={{ color: colors.primary }}>{f.showPassword ? "Sembunyikan" : "Lihat"}</Text>
            </TouchableOpacity>
          }
        />

        <CustomButton title={f.loading ? "Memuat…" : "Masuk"} onPress={f.submit} disabled={f.loading} style={{ marginTop: 8 }} />

        <Text style={{ color: "#666", textAlign: "center", marginTop: 16 }}>Mobile Corporate v2</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}