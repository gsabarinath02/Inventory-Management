import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

// Mock the auth context
const mockUseAuth = {
  user: null,
  isLoading: false,
  error: null,
  login: jest.fn(),
  logout: jest.fn(),
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockUseAuth,
}));

const ProtectedContent = () => <div data-testid="protected-content">Protected Content</div>;

const renderProtectedRoute = (requiredRole?: string) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole={requiredRole as any}>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values
    mockUseAuth.user = null;
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  describe('Authentication Check', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'admin' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockUseAuth.user = null;
      mockUseAuth.isLoading = false;

      renderProtectedRoute();

      // Should redirect to login page
      expect(window.location.pathname).toBe('/login');
    });

    it('should show loading when auth is loading', () => {
      mockUseAuth.user = null;
      mockUseAuth.isLoading = true;

      renderProtectedRoute();
      
      expect(screen.getByRole('status')).toBeInTheDocument(); // Spin component has role="status"
    });
  });

  describe('Role-Based Access Control', () => {
    it('should render children when user has required role', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'admin' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('admin');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should render children when no role is required', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'viewer' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute();

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should redirect to home when user does not have required role', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'viewer' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('admin');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    });

    it('should handle case-insensitive role comparison', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'ADMIN' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('admin');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('Role Hierarchy', () => {
    it('should allow admin to access manager routes', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'admin' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('manager');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should allow admin to access viewer routes', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'admin' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('viewer');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should allow manager to access viewer routes', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'manager' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('viewer');

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('should not allow viewer to access manager routes', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'viewer' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('manager');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should not allow manager to access admin routes', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'manager' };
      mockUseAuth.isLoading = false;

      renderProtectedRoute('admin');

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Custom Fallback', () => {
    it('should render custom fallback when provided', () => {
      mockUseAuth.user = { id: 1, username: 'test', role: 'viewer' };
      mockUseAuth.isLoading = false;

      const CustomFallback = () => <div data-testid="custom-fallback">Custom Access Denied</div>;

      render(
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route
                path="/"
                element={
                  <ProtectedRoute requiredRole="admin" fallback={<CustomFallback />}>
                    <ProtectedContent />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should handle auth context errors', () => {
      mockUseAuth.user = null;
      mockUseAuth.isLoading = false;
      mockUseAuth.error = 'Auth error';

      renderProtectedRoute();

      // Should redirect to login page
      expect(window.location.pathname).toBe('/login');
    });
  });
}); 