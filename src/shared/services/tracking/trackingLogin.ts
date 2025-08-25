// trackingLogin.ts - Login tracking functionality
import { isLocationTrackingEnabled, sendLoginLocationOnce } from './locationService';
import { ensureLocationReady } from './locationPermissions';

export async function startLoginTrackingIfEnabled(overrideLjk?: string): Promise<boolean> {
  try {
    console.log('[tracking] === STARTING LOGIN TRACKING ===');

    const enabled = await isLocationTrackingEnabled(overrideLjk);
    if (!enabled) {
      console.log('[tracking] Login tracking disabled by server config');
      return false;
    }

    const locationReady = await ensureLocationReady();
    if (!locationReady) {
      console.warn('[tracking] Location services not ready for login tracking');
      return false;
    }

    const sent = await sendLoginLocationOnce(overrideLjk);
    console.log('[tracking] === LOGIN TRACKING COMPLETED - sent:', sent, '===');
    return sent;
  } catch (error) {
    console.error('[tracking] CRITICAL ERROR in startLoginTrackingIfEnabled:', error);
    return false;
  }
}

export function startLoginTrackingSafe(overrideLjk?: string): void {
  setTimeout(() => {
    startLoginTrackingIfEnabled(overrideLjk)
      .then(success =>
        console.log('[tracking] Background login tracking completed:', success),
      )
      .catch(error =>
        console.error('[tracking] Background login tracking failed:', error),
      );
  }, 2000);
}