import OneSignal from "react-native-onesignal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import supabase from "./supabaseClient";
import { ENV } from "../../config/env";

const OSN: any = OneSignal;
let initialized = false;

export function initOneSignalOnce() {
  if (initialized || !ENV?.ONESIGNAL_APP_ID) return;
  try {
    OSN?.initialize?.(ENV.ONESIGNAL_APP_ID);
    OSN?.setAppId?.(ENV.ONESIGNAL_APP_ID);
    initialized = true;
  } catch (e) {
    console.warn("[OneSignal] init failed:", e);
  }
}

export async function requestNotifPermIfNeeded(): Promise<boolean> {
  try {
    if (OSN?.Notifications?.getPermissionAsync) {
      const perm = await OSN.Notifications.getPermissionAsync();
      if (perm?.status !== "granted") await OSN.Notifications.requestPermission(true);
      return true;
    }
    if (typeof OSN?.hasPermission === "function") {
      const has = await OSN.hasPermission();
      if (has) return true;
      const granted =
        (await OSN.requestPermission?.(true)) ??
        (await OSN.promptForPushNotificationsWithUserResponse?.());
      return !!granted;
    }
    return true;
  } catch (e) {
    console.warn("[OneSignal] perm error:", e);
    return true;
  }
}

export async function identifyOneSignal(externalId: string) {
  try {
    if (!externalId) return;
    if (typeof OSN?.login === "function") await OSN.login(externalId);
    else if (typeof OSN?.setExternalUserId === "function") await OSN.setExternalUserId(externalId);
  } catch (e) {
    console.warn("[OneSignal] identify error:", e);
  }
}

export function setupPushAfterLogin(kodeKantorInt: number, username: string) {
  try {
    initOneSignalOnce();
    const externalId = `${kodeKantorInt}${username}`;
    requestNotifPermIfNeeded()
      .then(() => identifyOneSignal(externalId))
      .catch((e) => console.warn("[OneSignal] setup after login error:", e));
  } catch (e) {
    console.warn("[OneSignal] setupPushAfterLogin error:", e);
  }
}

export async function ensureTenantRow(id_tenant: number, tenant_name: string) {
  try {
    const { data, error } = await supabase
      .from("tenant")
      .select("id_tenant")
      .eq("id_tenant", id_tenant);

    if (error) {
      console.warn("[tenant] select error:", error);
      return;
    }
    if (!data || data.length === 0) {
      const { error: insErr } = await supabase
        .from("tenant")
        .insert([{ id_tenant, tenant_name }]);
      if (insErr) console.warn("[tenant] insert error:", insErr);
    }
  } catch (e) {
    console.warn("[tenant] ensureTenantRow failed:", e);
  }
}

export function syncOneSignalToken(kodeKantorInt: number, username: string) {
  setupPushAfterLogin(kodeKantorInt, username);
}

export default {
  initOneSignalOnce,
  requestNotifPermIfNeeded,
  identifyOneSignal,
  setupPushAfterLogin,
  syncOneSignalToken,
  ensureTenantRow,
};
