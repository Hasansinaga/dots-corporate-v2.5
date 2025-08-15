import AsyncStorage from "@react-native-async-storage/async-storage"
import API from "../../shared/services/APIManager"
import { jwtDecode } from 'jwt-decode'
import { ensureTenantRow, syncOneSignalToken } from "../../shared/services/pushService"
import { ensureLocationReady, startLocationInterval } from "../../shared/services/trackingService"

export interface LoginResponse { access_token: string }
export interface DecodedToken {
  user?: { id?: number; username?: string }
  tenant?: { name?: string }
}

export async function login({ username, password, kodeKantor }: { username: string; password: string; kodeKantor: number }) {
  const { data } = await API.post<LoginResponse>(
    "/authentication/login",
    { username, password },
    { headers: { "X-Tenant-Id": String(kodeKantor), Authorization: undefined as any } },
  )

  const decoded = jwtDecode<DecodedToken>(data.access_token)
  const userId = String(decoded?.user?.id ?? "")
  const uname = decoded?.user?.username ?? username
  const tenantName = decoded?.tenant?.name ?? ""

  await AsyncStorage.multiSet([
    ["authToken", data.access_token],
    ["kodeKantor", String(kodeKantor)],
    ["userId", userId],
    ["username", uname],
    ["tenantName", tenantName],
  ])

  API.defaults.headers.common.Authorization = `Bearer ${data.access_token}`
  API.defaults.headers.common["X-Tenant-Id"] = String(kodeKantor)

  if (tenantName) await ensureTenantRow(kodeKantor, tenantName)
  await syncOneSignalToken(kodeKantor, uname)

  const ok = await ensureLocationReady()
  if (ok) await startLocationInterval()
}