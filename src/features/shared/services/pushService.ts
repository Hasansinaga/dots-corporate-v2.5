import { OneSignal } from 'react-native-onesignal'
import AsyncStorage from "@react-native-async-storage/async-storage"
import supabase from "./supabaseClient"
import { ENV } from "@/config/env"

export function initOneSignalOnce() {
  if (ENV.ONESIGNAL_APP_ID) {
    OneSignal.initialize(ENV.ONESIGNAL_APP_ID)
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const has = await OneSignal.Notifications.hasPermission()
    if (has) return true
    const granted = await OneSignal.Notifications.requestPermission(false)
    return !!granted
  } catch {
    return false
  }
}

export async function syncOneSignalToken(kodeKantorInt: number, username: string) {
  const enabled = await ensureNotificationPermission()
  if (!enabled) return

  const externalId = `${kodeKantorInt}${username}`
  await OneSignal.login(externalId)

  const userId = await AsyncStorage.getItem("userId")
  const tenantIdString = await AsyncStorage.getItem("kodeKantor")
  const tenantId = tenantIdString ? parseInt(tenantIdString, 10) : NaN
  if (!userId || Number.isNaN(tenantId)) return

  const { data: existing } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (!existing) {
    await supabase.from("users").insert({ user_id: userId, tenant_id: tenantId, push_token: externalId })
  } else {
    await supabase.from("users").update({ push_token: externalId }).eq("user_id", userId).eq("tenant_id", tenantId)
  }
}

export async function ensureTenantRow(id_tenant: number, tenant_name: string) {
  const { data } = await supabase.from("tenant").select("id_tenant").eq("id_tenant", id_tenant)
  if (!data || data.length === 0) {
    await supabase.from("tenant").insert([{ id_tenant, tenant_name }])
  }
}