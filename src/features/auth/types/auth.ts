export interface LoginResponse { access_token: string }
export interface DecodedToken {
  user?: { id?: number; username?: string }
  tenant?: { name?: string }
}
export interface LoginPayload { username: string; password: string; kodeKantor: number }