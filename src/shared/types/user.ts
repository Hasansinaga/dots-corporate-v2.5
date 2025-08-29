export interface User {
  id: string;
  username: string;
  email?: string;
  tenantId: string;
  tenantName?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
  kodeKantor: number;
}

export interface LoginResponse {
  access_token: string;
}

export interface DecodedToken {
  user?: { 
    id?: number; 
    username?: string;
    email?: string;
  };
  tenant?: { 
    name?: string;
    id?: string;
  };
}
