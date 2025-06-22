import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = authService.getToken();
        const storedUser = authService.getUser();

        if (storedToken && storedUser) {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (error) {
        // Token is invalid, clear storage
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      
      // First, set the token
      authService.setToken(response.access_token);
      setToken(response.access_token);

      // Now, fetch the user data with the token set
      const userData = await authService.getCurrentUser();
      authService.setUser(userData);
      setUser(userData);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
      // Clear token if login fails at any stage after getting it
      logout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 