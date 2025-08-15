import { useState } from "react"
import { useNavigation } from "@react-navigation/native"
import { validateLogin } from "../utils/validation"
import { login as doLogin } from "../services/authService"

export function useLoginForm() {
  const nav = useNavigation<any>()
  const [kodeKantor, setKodeKantor] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ kodeKantor?: string; username?: string; password?: string; general?: string }>({})

  const submit = async () => {
    const v = validateLogin({ kodeKantor, username, password })
    if (!v.ok) return setErrors(v.errors)

    setLoading(true)
    try {
      await doLogin({ username, password, kodeKantor: parseInt(kodeKantor, 10) })
      nav.reset({ index: 0, routes: [{ name: "Home" }] })
    } catch (e: any) {
      setErrors({ general: e?.message ?? "Login gagal. Periksa kembali data." })
    } finally {
      setLoading(false)
    }
  }

  return {
    kodeKantor,
    setKodeKantor: (t: string) => setKodeKantor(t.replace(/[^0-9]/g, "").slice(0, 6)),
    username,
    setUsername,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    loading,
    errors,
    setErrors,
    submit,
  }
}