export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type MobileStatus = {
  isMobile:boolean;
  errStatus: boolean;
};

export interface AuthCredentials {
  user: User;
  mfaRequired?: boolean;
  mfaToken?: string;
}

export interface AuthState {
  // State
  user: User | null;

  // Actions
  setAuth: (credentials: AuthCredentials) => void;
  clear: () => void;
}
