export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'viewer';
}

export interface UserUpdate {
  name?: string;
  email?: string;
  role?: 'admin' | 'manager' | 'viewer';
} 