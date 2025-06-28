import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import * as authService from '../../services/authService';
import * as api from '../../services/api';

// Mock all services
jest.mock('../../services/authService');
jest.mock('../../services/api');

const mockAuthService = authService as jest.Mocked<typeof authService>;
const mockApi = api as jest.Mocked<typeof api>;

// Mock child components to focus on integration
jest.mock('../../layout/MainLayout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>;
  };
});

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full authentication flow', async () => {
      const user = userEvent.setup();
      
      // Mock initial state - no user logged in
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      
      renderApp();
      
      // Should show login page initially
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
      
      // Mock successful login
      const mockUser = { id: 1, username: 'testuser', role: 'admin' };
      const mockToken = 'valid-token';
      
      mockAuthService.login.mockResolvedValue({ access_token: mockToken });
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.setToken.mockImplementation(() => {});
      mockAuthService.setUser.mockImplementation(() => {});
      
      // Fill login form
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      // Should redirect to main layout after successful login
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
      
      // Verify auth service calls
      expect(mockAuthService.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockAuthService.setToken).toHaveBeenCalledWith(mockToken);
      expect(mockAuthService.getCurrentUser).toHaveBeenCalled();
      expect(mockAuthService.setUser).toHaveBeenCalledWith(mockUser);
    });

    it('should handle authentication errors', async () => {
      const user = userEvent.setup();
      
      // Mock initial state - no user logged in
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      
      renderApp();
      
      // Mock failed login
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));
      
      // Fill login form
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(usernameInput, 'wronguser');
      await user.type(passwordInput, 'wrongpass');
      await user.click(loginButton);
      
      // Should stay on login page and show error
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
      
      // Verify error handling
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Protected Routes', () => {
    it('should protect admin routes from non-admin users', async () => {
      // Mock authenticated non-admin user
      const mockUser = { id: 1, username: 'user', role: 'user' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      // Navigate to admin route
      window.history.pushState({}, '', '/users');
      renderApp();
      
      // Should redirect to home page
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
      
      // Should not show admin content
      expect(screen.queryByTestId('user-management')).not.toBeInTheDocument();
    });

    it('should allow admin users to access admin routes', async () => {
      // Mock authenticated admin user
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      // Navigate to admin route
      window.history.pushState({}, '', '/users');
      renderApp();
      
      // Should show admin content
      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Flow', () => {
    beforeEach(async () => {
      // Mock authenticated user for all navigation tests
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    });

    it('should navigate between all main routes', async () => {
      renderApp();
      
      // Should start at product list
      await waitFor(() => {
        expect(screen.getByTestId('product-list')).toBeInTheDocument();
      });
      
      // Navigate to product view
      window.history.pushState({}, '', '/product-view');
      await waitFor(() => {
        expect(screen.getByTestId('product-view')).toBeInTheDocument();
      });
      
      // Navigate to upload
      window.history.pushState({}, '', '/upload');
      await waitFor(() => {
        expect(screen.getByTestId('upload')).toBeInTheDocument();
      });
      
      // Navigate to users (admin route)
      window.history.pushState({}, '', '/users');
      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument();
      });
      
      // Navigate to activity logs (admin route)
      window.history.pushState({}, '', '/activity-logs');
      await waitFor(() => {
        expect(screen.getByTestId('activity-logs')).toBeInTheDocument();
      });
      
      // Navigate to registration (admin route)
      window.history.pushState({}, '', '/registration');
      await waitFor(() => {
        expect(screen.getByTestId('registration')).toBeInTheDocument();
      });
    });

    it('should redirect unknown routes to home', async () => {
      renderApp();
      
      // Navigate to unknown route
      window.history.pushState({}, '', '/unknown-route');
      
      // Should redirect to product list
      await waitFor(() => {
        expect(screen.getByTestId('product-list')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock authenticated user
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock API error
      mockApi.productAPI.getAll.mockRejectedValue(new Error('API Error'));
      
      renderApp();
      
      // Should still render the layout even with API errors
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      // Mock authenticated user
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      // Mock network error
      mockApi.productAPI.getAll.mockRejectedValue(new Error('Network Error'));
      
      renderApp();
      
      // Should still render the layout even with network errors
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during authentication check', () => {
      // Mock slow authentication check
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderApp();
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading during login process', async () => {
      const user = userEvent.setup();
      
      // Mock initial state
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);
      
      renderApp();
      
      // Mock slow login
      mockAuthService.login.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      // Fill login form
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);
      
      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Token Expiration', () => {
    it('should handle token expiration and redirect to login', async () => {
      // Mock expired token
      mockAuthService.getToken.mockReturnValue('expired-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Token expired'));
      
      renderApp();
      
      // Should redirect to login after token validation fails
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
      
      // Should clear invalid token
      expect(mockAuthService.logout).toHaveBeenCalled();
    });
  });

  describe('Theme and Styling', () => {
    it('should apply custom theme configuration', async () => {
      // Mock authenticated user
      const mockUser = { id: 1, username: 'admin', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
      });
      
      // Check that ConfigProvider is rendered with theme
      const configProvider = document.querySelector('.ant-config-provider');
      expect(configProvider).toBeInTheDocument();
    });
  });
}); 