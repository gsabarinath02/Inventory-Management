import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import Registration from '../pages/Registration';
import { AuthProvider } from '../context/AuthContext';

// Mock the API calls
jest.mock('../services/api', () => ({
  getCustomers: jest.fn(() => Promise.resolve([])),
  createCustomer: jest.fn(() => Promise.resolve({ id: 1, store_name: 'Test Store' })),
  updateCustomer: jest.fn(() => Promise.resolve({ id: 1, store_name: 'Updated Store' })),
  deleteCustomer: jest.fn(() => Promise.resolve()),
  getAgencies: jest.fn(() => Promise.resolve([])),
  createAgency: jest.fn(() => Promise.resolve({ id: 1, agency_name: 'Test Agency' })),
  updateAgency: jest.fn(() => Promise.resolve({ id: 1, agency_name: 'Updated Agency' })),
  deleteAgency: jest.fn(() => Promise.resolve()),
}));

// Mock the auth context
const mockAuthContext = {
  user: { id: 1, username: 'admin', role: 'admin' },
  token: 'test-token',
  login: jest.fn(),
  logout: jest.fn(),
  isLoading: false,
  error: null,
};

jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => mockAuthContext,
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConfigProvider>
      <BrowserRouter>
        <AuthProvider>
          {component}
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

describe('Registration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration page with tabs', () => {
    renderWithProviders(<Registration />);
    
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Agencies')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add customer/i })).toBeInTheDocument();
  });

  test('opens customer modal when Add Customer is clicked', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    // Find the modal by role dialog
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Add Customer')).toBeInTheDocument();
    expect(within(modal).getByLabelText('Store Name')).toBeInTheDocument();
    expect(within(modal).getByLabelText('Referrer')).toBeInTheDocument();
  });

  test('opens agency modal when Add Agency is clicked', async () => {
    renderWithProviders(<Registration />);
    
    // Switch to agencies tab
    const agenciesTab = screen.getByText('Agencies');
    fireEvent.click(agenciesTab);
    
    const addAgencyButton = screen.getByRole('button', { name: /add agency/i });
    fireEvent.click(addAgencyButton);
    
    // Find the modal by role dialog
    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText('Add Agency')).toBeInTheDocument();
    expect(within(modal).getByLabelText('Agency Name')).toBeInTheDocument();
  });

  test('validates required fields in customer form', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter Store Name')).toBeInTheDocument();
      expect(screen.getByText('Please select Referrer')).toBeInTheDocument();
    });
  });

  test('validates mobile number format', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    const ownerMobileInput = screen.getByLabelText('Owner Mobile');
    fireEvent.change(ownerMobileInput, { target: { value: '123' } });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Mobile must be exactly 10 digits')).toBeInTheDocument();
    });
  });

  test('validates GST number format', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    const gstInput = screen.getByLabelText('GST Number');
    fireEvent.change(gstInput, { target: { value: '123456789012345' } });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('GST must be 2 digits followed by 13 alphanumeric characters')).toBeInTheDocument();
    });
  });

  test('validates pincode format', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    const pincodeInput = screen.getByLabelText('Pincode');
    fireEvent.change(pincodeInput, { target: { value: '123' } });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Pincode must be exactly 6 digits')).toBeInTheDocument();
    });
  });

  test('submits customer form with valid data', async () => {
    const { createCustomer } = require('../services/api');
    
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Store Name'), { target: { value: 'Test Store' } });
    fireEvent.change(screen.getByLabelText('Owner Mobile'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Accounts Team Mobile'), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText('Days of Payment'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '27ABCDE1234567' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '123456' } });
    
    // Select referrer
    const referrerSelect = screen.getByLabelText('Referrer');
    fireEvent.mouseDown(referrerSelect);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option', { name: 'Nagarajan' });
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]);
    });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith({
        store_name: 'Test Store',
        referrer: 'Nagarajan',
        owner_mobile: '1234567890',
        accounts_mobile: '0987654321',
        days_of_payment: 30,
        gst_number: '27ABCDE1234567',
        address: 'Test Address',
        pincode: '123456',
      });
    });
  });

  test('handles form submission errors gracefully', async () => {
    const { createCustomer } = require('../services/api');
    createCustomer.mockRejectedValueOnce({
      response: {
        status: 422,
        data: {
          detail: 'Validation error: Store name already exists'
        }
      }
    });
    
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Store Name'), { target: { value: 'Test Store' } });
    fireEvent.change(screen.getByLabelText('Owner Mobile'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Accounts Team Mobile'), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText('Days of Payment'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '27ABCDE1234567' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '123456' } });
    
    // Select referrer
    const referrerSelect = screen.getByLabelText('Referrer');
    fireEvent.mouseDown(referrerSelect);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option', { name: 'Nagarajan' });
      expect(options.length).toBeGreaterThan(0);
      fireEvent.click(options[0]);
    });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Validation error: Store name already exists/)).toBeInTheDocument();
    });
  });

  test('validates referrer selection', async () => {
    renderWithProviders(<Registration />);
    
    const addCustomerButton = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addCustomerButton);
    
    // Fill in other required fields
    fireEvent.change(screen.getByLabelText('Store Name'), { target: { value: 'Test Store' } });
    fireEvent.change(screen.getByLabelText('Owner Mobile'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByLabelText('Accounts Team Mobile'), { target: { value: '0987654321' } });
    fireEvent.change(screen.getByLabelText('Days of Payment'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '27ABCDE1234567' } });
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '123456' } });
    
    const createButton = screen.getByText('Create');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select Referrer')).toBeInTheDocument();
    });
  });
}); 