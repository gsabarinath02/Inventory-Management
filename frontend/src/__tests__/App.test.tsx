import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';
import * as authService from '../services/authService';

// Mock the auth service
jest.mock('../services/authService');
const mockAuthService = authService as jest.Mocked<typeof authService>;

// Mock child components to focus on App routing logic
jest.mock('../layout/MainLayout', () => {
  return function MockMainLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="main-layout">{children}</div>;
  };
});

jest.mock('../features/products/ProductList', () => {
  return function MockProductList() {
    return <div data-testid="product-list">Product List</div>;
  };
});

jest.mock('../features/products/ProductView', () => {
  return function MockProductView() {
    return <div data-testid="product-view">Product View</div>;
  };
});

jest.mock('../features/upload/Upload', () => {
  return function MockUpload() {
    return <div data-testid="upload">Upload</div>;
  };
});

jest.mock('../pages/Login', () => {
  return function MockLogin() {
    return <div data-testid="login">Login</div>;
  };
});

jest.mock('../pages/UserManagement', () => {
  return function MockUserManagement() {
    return <div data-testid="user-management">User Management</div>;
  };
});

jest.mock('../pages/ActivityLogs', () => {
  return function MockActivityLogs() {
    return <div data-testid="activity-logs">Activity Logs</div>;
  };
});

jest.mock('../pages/Registration', () => {
  return function MockRegistration() {
    return <div data-testid="registration">Registration</div>;
  };
});

jest.mock('../components/ProtectedRoute', () => {
  return function MockProtectedRoute({ children }: { children: React.ReactNode }) {
    return <div data-testid="protected-route">{children}</div>;
  };
});

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
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

  describe('Authentication State', () => {
    it('should show loading state initially', () => {
      mockAuthService.getToken.mockReturnValue('mock-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderApp();
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should redirect to login when no token exists', async () => {
      mockAuthService.getToken.mockReturnValue(null);
      mockAuthService.getUser.mockReturnValue(null);

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });

    it('should redirect to login when token is invalid', async () => {
      mockAuthService.getToken.mockReturnValue('invalid-token');
      mockAuthService.getUser.mockReturnValue({ id: 1, username: 'test', role: 'admin' });
      mockAuthService.getCurrentUser.mockRejectedValue(new Error('Invalid token'));

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });

    it('should show main layout when user is authenticated', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
        expect(screen.getByTestId('product-list')).toBeInTheDocument();
      });
    });
  });

  describe('Routing', () => {
    beforeEach(async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
    });

    it('should render ProductList on root path', async () => {
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('product-list')).toBeInTheDocument();
      });
    });

    it('should render ProductView on /product-view path', async () => {
      window.history.pushState({}, '', '/product-view');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('product-view')).toBeInTheDocument();
      });
    });

    it('should render Upload on /upload path', async () => {
      window.history.pushState({}, '', '/upload');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('upload')).toBeInTheDocument();
      });
    });

    it('should render UserManagement on /users path for admin', async () => {
      window.history.pushState({}, '', '/users');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('user-management')).toBeInTheDocument();
      });
    });

    it('should render ActivityLogs on /activity-logs path for admin', async () => {
      window.history.pushState({}, '', '/activity-logs');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('activity-logs')).toBeInTheDocument();
      });
    });

    it('should render Registration on /registration path for admin', async () => {
      window.history.pushState({}, '', '/registration');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('registration')).toBeInTheDocument();
      });
    });

    it('should redirect to root for unknown paths', async () => {
      window.history.pushState({}, '', '/unknown-path');
      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('product-list')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Configuration', () => {
    it('should apply custom theme configuration', async () => {
      const mockUser = { id: 1, username: 'test', role: 'admin' };
      mockAuthService.getToken.mockReturnValue('valid-token');
      mockAuthService.getUser.mockReturnValue(mockUser);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      renderApp();
      
      await waitFor(() => {
        // Check that ConfigProvider is rendered with theme
        const configProvider = document.querySelector('.ant-config-provider');
        expect(configProvider).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth service errors gracefully', async () => {
      mockAuthService.getToken.mockImplementation(() => {
        throw new Error('Storage error');
      });

      renderApp();
      
      await waitFor(() => {
        expect(screen.getByTestId('login')).toBeInTheDocument();
      });
    });
  });
}); 