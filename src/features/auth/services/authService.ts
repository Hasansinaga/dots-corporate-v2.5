// ===== authService.ts =====
import AsyncStorage from "@react-native-async-storage/async-storage"
import API from "../../../shared/services/APIManager"
import { jwtDecode } from 'jwt-decode'
import { ensureTenantRow, syncOneSignalToken } from "../../../shared/services/pushService"
import {
  setActiveTenant,
  isLocationTrackingEnabled,
  startLoginTrackingIfEnabled,
  startBackgroundTrackingIfEnabled,
} from "../../../shared/services/trackingService"

export interface LoginResponse { access_token: string }
export interface DecodedToken {
  user?: { id?: number; username?: string }
  tenant?: { name?: string }
}
export interface LoginPayload { username: string; password: string; kodeKantor: number }

export async function login({ username, password, kodeKantor }: LoginPayload) {
  try {
    console.log("[auth] Attempting login:", { username, kodeKantor })

    // request tanpa Authorization; tenant dikirim via header
    const { data } = await API.post<LoginResponse>(
      "/authentication/login",
      { username, password },
      { headers: { "X-Tenant-Id": String(kodeKantor), Authorization: undefined as any } },
    )

    if (!data?.access_token) throw new Error("Token tidak diterima dari server")

    // decode
    let decoded: DecodedToken
    try {
      decoded = jwtDecode<DecodedToken>(data.access_token)
    } catch (e) {
      console.error("[auth] jwt decode error:", e)
      throw new Error("Token tidak valid")
    }

    const userId = String(decoded?.user?.id ?? "")
    const uname = decoded?.user?.username ?? username
    const tenantName = decoded?.tenant?.name ?? ""
    if (!userId) throw new Error("Data pengguna tidak valid")

    // simpan ke storage
    await AsyncStorage.multiSet([
      ["authToken", data.access_token],
      ["kodeKantor", String(kodeKantor)],
      ["userId", userId],
      ["username", uname],
      ["tenantName", tenantName],
    ])

    // set header default untuk request selanjutnya
    API.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
    API.defaults.headers.common["X-Tenant-Id"] = String(kodeKantor)

    // prioritas tertinggi: in-memory tenant
    setActiveTenant(String(kodeKantor))
    // setup pasca login (non-fatal kalau gagal)
    try {
      if (tenantName) await ensureTenantRow(kodeKantor, tenantName)
      await syncOneSignalToken(kodeKantor, uname)

      await handleLoginTracking(kodeKantor)
    } catch (e) {
      console.warn("[auth] post-login setup warning:", e)
    }

    return { success: true, user: { id: userId, username: uname } }
  } catch (error: any) {
    console.error("[auth] Login error:", error)
    const status = error?.response?.status
    const data = error?.response?.data

    if (status === 401) throw new Error("Username atau password salah")
    if (status === 403) throw new Error("Akses ditolak untuk kode kantor ini")
    if (status === 404) throw new Error("Kode kantor tidak ditemukan")
    if (status === 500) {
      const serverMessage = data?.message || data?.error
      if (serverMessage && !String(serverMessage).toLowerCase().includes('internal')) {
        throw new Error(serverMessage)
      }
      throw new Error("Login gagal. Mohon periksa kembali data yang Anda masukkan")
    }
    if (status >= 500) throw new Error("Server sedang bermasalah, coba lagi nanti")
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
      throw new Error("Tidak dapat terhubung ke server")
    }
    if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
      throw new Error("Koneksi timeout, coba lagi")
    }
    throw new Error("Login gagal. Mohon periksa kembali data yang Anda masukkan")
  }
}

async function handleLoginTracking(kodeKantor: number): Promise<void> {
  try {
    const ljk = String(kodeKantor)
    const enabled = await isLocationTrackingEnabled(ljk)
    console.log('[auth] tracking enabled:', enabled)
    if (!enabled) return

    // 1) kirim titik sekali
    await startLoginTrackingIfEnabled(ljk)

    // 2) mulai periodik / foreground service
    await startBackgroundTrackingIfEnabled(ljk)
  } catch (e) {
    console.warn('[auth] tracking setup error:', e)
  }
}
