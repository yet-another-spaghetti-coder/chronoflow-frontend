export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export interface AuthCredentials {
  user: User;
}

export interface AuthState {
  // State
  user: User | null;

  // Actions
  setAuth: (credentials: AuthCredentials) => void;
  clear: () => void;
}
