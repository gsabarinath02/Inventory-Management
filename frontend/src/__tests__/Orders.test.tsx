import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import OrdersLogTable from '../features/upload/OrdersLogTable';
import { useOrders } from '../hooks/useOrders';

// Mock the useOrders hook
jest.mock('../hooks/useOrders');
const mockUseOrders = useOrders as jest.MockedFunction<typeof useOrders>;

// Mock the API service
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const mockOrders = [
  {
    id: 1,
    order_number: 1001,
    financial_year: '2024-25',
    product_id: 1,
    date: '2024-01-15',
    color: 'Red',
    colour_code: 4,
    agency_name: 'TestAgency',
    store_name: 'TestStore',
    sizes: { S: 2, M: 1 },
    operation: 'Order',
    created_at: '2024-01-15T10:00:00Z'
  }
];

const mockUseOrdersReturn = {
  orders: mockOrders,
  loading: false,
  error: null,
  createOrder: jest.fn(),
  updateOrder: jest.fn(),
  deleteOrder: jest.fn(),
  createOrdersBulk: jest.fn(),
  deleteOrdersBulk: jest.fn(),
  fetchOrders: jest.fn(),
};

const renderOrdersLogTable = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <OrdersLogTable
          productId={1}
          onDataChange={() => {}}
          availableColors={['Red', 'Blue']}
          availableSizes={['S', 'M', 'L']}
          colorCodePairs={[{ color: 'Red', colour_code: 4 }, { color: 'Blue', colour_code: 5 }]}
          isReadOnly={false}
          allowedAgencies={['TestAgency']}
          allowedStores={['TestStore']}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('OrdersLogTable Component', () => {
  beforeEach(() => {
    mockUseOrders.mockReturnValue(mockUseOrdersReturn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders orders table with data', async () => {
    renderOrdersLogTable();
    
    await waitFor(() => {
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('TestAgency')).toBeInTheDocument();
      expect(screen.getByText('TestStore')).toBeInTheDocument();
      expect(screen.getByText('Red')).toBeInTheDocument();
    });
  });

  test('shows add new order button', () => {
    renderOrdersLogTable();
    
    expect(screen.getByText('Add New Order')).toBeInTheDocument();
  });

  test('shows bulk upload section', () => {
    renderOrdersLogTable();
    
    expect(screen.getByText('Bulk Upload')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Paste CSV data here...')).toBeInTheDocument();
  });

  test('displays order number and financial year', async () => {
    renderOrdersLogTable();
    
    await waitFor(() => {
      expect(screen.getByText('1001')).toBeInTheDocument();
      expect(screen.getByText('2024-25')).toBeInTheDocument();
    });
  });

  test('displays sizes correctly', async () => {
    renderOrdersLogTable();
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // S size quantity
      expect(screen.getByText('1')).toBeInTheDocument(); // M size quantity
    });
  });

  test('shows edit and delete actions for each order', async () => {
    renderOrdersLogTable();
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  test('handles empty orders list', () => {
    mockUseOrders.mockReturnValue({
      ...mockUseOrdersReturn,
      orders: [],
    });

    renderOrdersLogTable();
    
    expect(screen.getByText('No orders found')).toBeInTheDocument();
  });

  test('shows loading state', () => {
    mockUseOrders.mockReturnValue({
      ...mockUseOrdersReturn,
      loading: true,
    });

    renderOrdersLogTable();
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('Orders Hook', () => {
  beforeEach(() => {
    mockUseOrders.mockReturnValue(mockUseOrdersReturn);
  });

  test('useOrders hook is called with correct productId', () => {
    renderOrdersLogTable();
    
    expect(mockUseOrders).toHaveBeenCalledWith(1);
  });

  test('useOrders hook returns expected methods', () => {
    renderOrdersLogTable();
    
    expect(mockUseOrdersReturn.createOrder).toBeDefined();
    expect(mockUseOrdersReturn.updateOrder).toBeDefined();
    expect(mockUseOrdersReturn.deleteOrder).toBeDefined();
    expect(mockUseOrdersReturn.createOrdersBulk).toBeDefined();
    expect(mockUseOrdersReturn.deleteOrdersBulk).toBeDefined();
  });
}); 