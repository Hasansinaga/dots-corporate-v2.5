// authService.ts - Updated with new tracking service structure
import { AuthRepository } from "../repositories/authRepository";
import { User, LoginPayload } from "../../../shared/types/user";
import { ensureTenantRow, syncOneSignalToken } from "../../../shared/services/pushService";
import {
  setActiveTenant,
  isLocationTrackingEnabled,
  startLoginTrackingIfEnabled,
  startBackgroundTrackingIfEnabled,
} from "../../../shared/services/tracking/trackingService";

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  async login(credentials: LoginPayload): Promise<User> {
    try {
      console.log("[auth] Starting login process...");

      // 1. Perform login through repository
      const user = await this.authRepository.login(credentials);

      // 2. Set active tenant for tracking
      setActiveTenant(user.tenantId);

      // 3. Handle post-login setup in background
      this.handlePostLoginSetup(user).catch(error => {
        console.warn('[auth] Background post-login setup failed:', error);
      });

      console.log("[auth] Login successful for user:", user.username);
      return user;
    } catch (error) {
      console.error("[auth] Login service error:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log("[auth] Starting logout process...");
      await this.authRepository.logout();
      console.log("[auth] Logout completed");
    } catch (error) {
      console.error("[auth] Logout service error:", error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.authRepository.getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.authRepository.isAuthenticated();
  }

  async getAuthToken(): Promise<string | null> {
    return await this.authRepository.getAuthToken();
  }

  private async handlePostLoginSetup(user: User): Promise<void> {
    console.log('[auth] Starting background post-login setup...');
    
    try {
      // 1. Setup push notifications
      if (user.tenantName) {
        await ensureTenantRow(parseInt(user.tenantId), user.tenantName);
      }
      await syncOneSignalToken(parseInt(user.tenantId), user.username);

      // 2. Setup location tracking
      console.log('[auth] Checking if location tracking is enabled...');
      const trackingEnabled = await isLocationTrackingEnabled(user.tenantId);
      console.log('[auth] Location tracking enabled:', trackingEnabled);

      if (trackingEnabled) {
        console.log('[auth] Starting location tracking setup...');
        await startLoginTrackingIfEnabled(user.tenantId);
        await startBackgroundTrackingIfEnabled(user.tenantId);
      } else {
        console.log('[auth] Location tracking disabled, skipping setup');
      }

      console.log('[auth] Post-login setup completed successfully');
    } catch (error) {
      console.error('[auth] Post-login setup error:', error);
      // Don't throw error here as it's background process
    }
  }
}

// Export singleton instance
export const authService = new AuthService();