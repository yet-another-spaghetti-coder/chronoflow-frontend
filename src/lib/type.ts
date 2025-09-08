export type User = {
  id: string;
};

export interface AuthCredentials {
  user: User;
  accessToken: string;
  accessTokenExpireTime?: number;
}

export interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  accessTokenExpireTime: number | null;

  // Actions
  setAuth: (credentials: AuthCredentials) => void;
  clear: () => void;
  isTokenValid: () => boolean;
}
