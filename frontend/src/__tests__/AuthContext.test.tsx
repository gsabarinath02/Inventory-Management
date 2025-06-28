import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../context/AuthContext';
import * as authService from '../services/authService';

// Mock the auth service
jest.mock('../services/authService', () => ({
  getToken: jest.fn(),
  getUser: jest.fn(),
  setToken: jest.fn(),
  setUser: jest.fn(),
  removeToken: jest.fn(),
  removeUser: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const mockAuthService = authService as jest.Mocked<typeof authService>;

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, error, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading...' : 'Not Loading'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'No User'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <button onClick={() => login('test', 'password')} data-testid="login-btn">
        Login
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
};

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('should start with loading state', () => {
      mockAuthService.getToken.mockReturnValue('mock-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithAuth();

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    });

    it('should initialize with no user when no token exists', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });

    it('should initialize with user when valid token exists', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    it('should clear invalid token and user on initialization error', async () => {
      mockAuthService.getToken.mockReturnValue('invalid-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      renderWithAuth();

      await waitFor(() => {
        expect(mockAuthService.removeToken).toHaveBeenCalled();
        expect(mockAuthService.removeUser).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Login Functionality', () => {
    it('should successfully login user', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      const mockToken = 'new-token';
      
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.login.mockResolvedValue({ access_token: mockToken });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderWithAuth();

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('test', 'password');
        expect(mockAuthService.setToken).toHaveBeenCalledWith(mockToken);
        expect(mockAuthService.setUser).toHaveBeenCalledWith(mockUser);
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });
    });

    it('should handle login errors', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithAuth();

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });

    it('should handle getCurrentUser errors during login', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Failed to get user'));

      renderWithAuth();

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(mockAuthService.removeToken).toHaveBeenCalled();
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to get user');
      });
    });
  });

  describe('Logout Functionality', () => {
    it('should successfully logout user', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.logout.mockResolvedValue(undefined);

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      });

      await act(async () => {
        screen.getByTestId('logout-btn').click();
      });

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
        expect(mockAuthService.removeToken).toHaveBeenCalled();
        expect(mockAuthService.removeUser).toHaveBeenCalled();
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during login', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.login.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithAuth();

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      expect(screen.getByTestId('loading')).toHaveTextContent('Loading...');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-Error objects in login', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      mockAuthService.login.mockRejectedValue('String error');

      renderWithAuth();

      await act(async () => {
        screen.getByTestId('login-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('String error');
      });
    });

    it('should handle storage errors gracefully', async () => {
      mockAuthService.getToken.mockImplementation(() => {
        throw new Error('Storage error');
      });

      renderWithAuth();

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('No User');
      });
    });
  });
}); 