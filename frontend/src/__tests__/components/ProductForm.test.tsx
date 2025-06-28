import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Form } from 'antd';
import ProductForm from '../../components/ProductForm';
import { Product } from '../../types';

// Mock the API services
jest.mock('../../services/api', () => ({
  getAgencies: jest.fn().mockResolvedValue([
    { agency_name: 'Agency 1' },
    { agency_name: 'Agency 2' }
  ]),
  getCustomers: jest.fn().mockResolvedValue([
    { store_name: 'Store 1' },
    { store_name: 'Store 2' }
  ]),
}));

// Mock Ant Design icons
jest.mock('@ant-design/icons', () => ({
  MinusCircleOutlined: () => <span data-testid="minus-icon">-</span>,
  PlusOutlined: () => <span data-testid="plus-icon">+</span>,
}));

// Test wrapper component to provide form context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form}>
      {children}
    </Form>
  );
};

const defaultProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  isEditing: false,
  initialValues: undefined as Product | undefined,
};

const renderProductForm = (props = {}) => {
  return render(
    <TestWrapper>
      <ProductForm {...defaultProps} {...props} />
    </TestWrapper>
  );
};

describe('ProductForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', async () => {
    renderProductForm();

    // Check for basic form fields
    expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sku/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
  });

  it('loads agencies and customers on mount', async () => {
    renderProductForm();

    await waitFor(() => {
      expect(screen.getByText('Agency 1')).toBeInTheDocument();
      expect(screen.getByText('Agency 2')).toBeInTheDocument();
    });
  });

  it('handles form submission with valid data', async () => {
    const onSubmit = jest.fn();
    renderProductForm({ onSubmit });

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/product name/i), 'Test Product');
    await userEvent.type(screen.getByLabelText(/sku/i), 'TEST001');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('handles form cancellation', async () => {
    const onCancel = jest.fn();
    renderProductForm({ onCancel });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('populates form with initial values when editing', () => {
    const initialValues: Product = {
      id: 1,
      name: 'Existing Product',
      sku: 'EXIST001',
      description: 'Test description',
      category: 'Electronics',
      brand: 'Test Brand',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
    };

    renderProductForm({ 
      isEditing: true, 
      initialValues 
    });

    expect(screen.getByDisplayValue('Existing Product')).toBeInTheDocument();
    expect(screen.getByDisplayValue('EXIST001')).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    renderProductForm();

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/product name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/sku is required/i)).toBeInTheDocument();
    });
  });

  it('allows adding and removing color stock entries', async () => {
    renderProductForm();

    // Add a new color stock entry
    const addButton = screen.getByTestId('plus-icon');
    await userEvent.click(addButton);

    // Should show color and stock fields
    await waitFor(() => {
      expect(screen.getAllByLabelText(/color/i)).toHaveLength(2); // Initial + new
    });

    // Remove the added entry
    const removeButtons = screen.getAllByTestId('minus-icon');
    await userEvent.click(removeButtons[1]); // Click the second remove button

    await waitFor(() => {
      expect(screen.getAllByLabelText(/color/i)).toHaveLength(1); // Back to initial
    });
  });
}); 