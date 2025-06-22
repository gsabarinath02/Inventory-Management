import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Login from '../pages/Login';

// Mock the auth service
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    getCurrentUser: jest.fn(),
    setToken: jest.fn(),
    setUser: jest.fn(),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows demo credentials', () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByText('Demo Credentials:')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com / admin123')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please input your email!')).toBeInTheDocument();
      expect(screen.getByText('Please input your password!')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    renderWithProviders(<Login />);
    
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email!')).toBeInTheDocument();
    });
  });
}); 