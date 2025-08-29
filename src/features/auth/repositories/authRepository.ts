import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../../shared/services/APIManager";
import { jwtDecode } from 'jwt-decode';
import { User, LoginPayload, LoginResponse, DecodedToken } from "../../../shared/types/user";

export class AuthRepository {
  private readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'userData',
    KODE_KANTOR: 'kodeKantor',
    USER_ID: 'userId',
    USERNAME: 'username',
    TENANT_NAME: 'tenantName',
  } as const;

  async login(credentials: LoginPayload): Promise<User> {
    try {
      console.log("[auth] Attempting login:", { username: credentials.username, kodeKantor: credentials.kodeKantor });

      // API call tanpa Authorization; tenant dikirim via header
      const { data } = await API.post<LoginResponse>(
        "/authentication/login",
        { username: credentials.username, password: credentials.password },
        { 
          headers: { "X-Tenant-Id": String(credentials.kodeKantor), Authorization: undefined as any },
          timeout: 15000
        },
      );

      if (!data?.access_token) {
        throw new Error("Token tidak diterima dari server");
      }

      // Decode token
      const decoded = this.decodeToken(data.access_token);
      const user = this.createUserFromToken(decoded, credentials.kodeKantor, credentials.username);

      // Save to storage
      await this.saveUserData(user, data.access_token);

      // Set API headers
      this.setAPIAuthHeaders(data.access_token, credentials.kodeKantor);

      return user;
    } catch (error: any) {
      console.error("[auth] Login error:", error);
      throw this.handleLoginError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      console.log("[auth] Logging out user");
      
      // Clear API headers
      delete API.defaults.headers.common.Authorization;
      delete API.defaults.headers.common["X-Tenant-Id"];

      // Clear storage
      await AsyncStorage.multiRemove([
        this.STORAGE_KEYS.AUTH_TOKEN,
        this.STORAGE_KEYS.USER_DATA,
        this.STORAGE_KEYS.KODE_KANTOR,
        this.STORAGE_KEYS.USER_ID,
        this.STORAGE_KEYS.USERNAME,
        this.STORAGE_KEYS.TENANT_NAME,
        'trackingActive',
        'user'
      ]);

      console.log("[auth] Logout completed");
    } catch (error) {
      console.error("[auth] Logout error:", error);
      throw new Error("Gagal logout");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem(this.STORAGE_KEYS.USER_DATA);
      if (!userData) return null;

      const user: User = JSON.parse(userData);
      return user;
    } catch (error) {
      console.error("[auth] Error getting current user:", error);
      return null;
    }
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error("[auth] Error getting auth token:", error);
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) return false;

      // Verify token is not expired
      const decoded = this.decodeToken(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token has exp field and is not expired
      if (decoded && 'exp' in decoded && typeof decoded.exp === 'number' && decoded.exp < currentTime) {
        await this.logout();
        return false;
      }

      return true;
    } catch (error) {
      console.error("[auth] Error checking authentication:", error);
      return false;
    }
  }

  private decodeToken(token: string): DecodedToken {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("[auth] Token decode error:", error);
      throw new Error("Token tidak valid");
    }
  }

  private createUserFromToken(decoded: DecodedToken, kodeKantor: number, username: string): User {
    const userId = String(decoded?.user?.id ?? "");
    const uname = decoded?.user?.username ?? username;
    const email = decoded?.user?.email;
    const tenantName = decoded?.tenant?.name ?? "";

    if (!userId) {
      throw new Error("Data pengguna tidak valid");
    }

    return {
      id: userId,
      username: uname,
      email,
      tenantId: String(kodeKantor),
      tenantName,
    };
  }

  private async saveUserData(user: User, token: string): Promise<void> {
    await AsyncStorage.multiSet([
      [this.STORAGE_KEYS.AUTH_TOKEN, token],
      [this.STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      [this.STORAGE_KEYS.KODE_KANTOR, user.tenantId],
      [this.STORAGE_KEYS.USER_ID, user.id],
      [this.STORAGE_KEYS.USERNAME, user.username],
      [this.STORAGE_KEYS.TENANT_NAME, user.tenantName || ""],
    ]);
  }

  private setAPIAuthHeaders(token: string, kodeKantor: number): void {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    API.defaults.headers.common["X-Tenant-Id"] = String(kodeKantor);
  }

  private handleLoginError(error: any): Error {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) return new Error("Username atau password salah");
    if (status === 403) return new Error("Akses ditolak untuk kode kantor ini");
    if (status === 404) return new Error("Kode kantor tidak ditemukan");
    if (status === 500) {
      const serverMessage = data?.message || data?.error;
      if (serverMessage && !String(serverMessage).toLowerCase().includes('internal')) {
        return new Error(serverMessage);
      }
      return new Error("Login gagal. Mohon periksa kembali data yang Anda masukkan");
    }
    if (status >= 500) return new Error("Server sedang bermasalah, coba lagi nanti");
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network')) {
      return new Error("Tidak dapat terhubung ke server");
    }
    if (error?.code === 'TIMEOUT' || error?.message?.includes('timeout')) {
      return new Error("Koneksi timeout, coba lagi");
    }
    return new Error("Login gagal. Mohon periksa kembali data yang Anda masukkan");
  }
}
