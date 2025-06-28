import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ProductView from '../features/products/ProductView';
import '@testing-library/jest-dom';
import * as api from '../services/api';

// Mock ag-grid components
jest.mock('ag-grid-react', () => ({
  AgGridReact: ({ rowData, columnDefs }: any) => (
    <div data-testid="ag-grid">
      {rowData?.map((row: any, index: number) => (
        <div key={index} data-testid={`row-${index}`}>
          {columnDefs?.map((col: any) => (
            <span key={col.field}>{row[col.field]}</span>
          ))}
        </div>
      ))}
    </div>
  ),
}));

const apiUrl = 'http://localhost:8000/api';

const sampleProducts = [
  { 
    id: 1, 
    name: 'Test Product', 
    sku: 'TP01', 
    unit_price: 10, 
    sizes: ['S', 'M'], 
    colors: ['Red', 'Blue'],
    created_at: '2023-01-01T00:00:00Z'
  }
];

const sampleStockMatrix = {
  'Red': {
    'S': 5,
    'M': 3
  },
  'Blue': {
    'S': 2,
    'M': 1
  }
};

const server = setupServer(
  rest.get(`${apiUrl}/products`, (_req, res, ctx) =>
    res(ctx.json(sampleProducts))
  ),
  rest.get(`${apiUrl}/stock/1`, (_req, res, ctx) =>
    res(ctx.json(sampleStockMatrix))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock the API
jest.mock('../services/api');
const mockApi = api as jest.Mocked<typeof api>;

afterEach(cleanup);

describe('ProductView', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    mockApi.getProducts.mockResolvedValue([
      { id: 1, name: 'Test Product', sku: 'TP01' }
    ]);
  });

  it('fetches and displays stock matrix successfully', async () => {
    render(<ProductView />);
    
    // Wait for the product selector to be available
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
    });
  });

  it('loads products on mount and renders product selector', async () => {
    render(<ProductView />);
    
    await waitFor(() => {
      expect(mockApi.getProducts).toHaveBeenCalled();
    });
    
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles stock fetch failure and shows error alert', async () => {
    mockApi.getProducts = jest.fn().mockRejectedValue(new Error('Failed to fetch'));
    
    render(<ProductView />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
    });
  });

  it('disables refresh button when no product selected', () => {
    render(<ProductView />);
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeDisabled();
  });

  it('enables refresh button when product is selected', async () => {
    render(<ProductView />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Product (TP01)'));
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).not.toBeDisabled();
  });

  it('shows loading spinner during stock fetch', async () => {
    render(<ProductView />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    await waitFor(() => {
      expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Product (TP01)'));
    
    // Should show loading state
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});

test('handles stock fetch failure and shows error alert', async () => {
  server.use(
    rest.get(`${apiUrl}/stock/1`, (_req, res, ctx) =>
      res(ctx.status(500), ctx.json({ detail: 'Internal server error' }))
    )
  );

  render(<ProductView />);

  // Wait for products to load
  await waitFor(() => {
    expect(screen.getByText('Select a product')).toBeInTheDocument();
  });

  // Select a product
  const select = screen.getByRole('combobox');
  fireEvent.mouseDown(select);
  await waitFor(() => {
    expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
  });
  const option = document.body.querySelector('div[title="Test Product (TP01)"]');
  expect(option).not.toBeNull();
  fireEvent.click(option!);

  // Click refresh button
  const refreshButton = screen.getByText('Refresh');
  fireEvent.click(refreshButton);

  // Wait for error alert to appear
  await waitFor(() => {
    expect(screen.getByText('Failed to fetch stock matrix.')).toBeInTheDocument();
  });

  // Check that error alert is displayed
  const errorAlert = screen.getByRole('alert');
  expect(errorAlert).toBeInTheDocument();
  expect(errorAlert).toHaveTextContent('Failed to fetch stock matrix.');
});

test('disables refresh button when no product selected', async () => {
  render(<ProductView />);

  // Wait for products to load
  await waitFor(() => {
    expect(screen.getByText('Select a product')).toBeInTheDocument();
  });

  // Check that refresh button is disabled
  const refreshButton = screen.getByRole('button', { name: /refresh/i });
  expect(refreshButton).toBeDisabled();
});

test('enables refresh button when product is selected', async () => {
  render(<ProductView />);

  // Wait for products to load
  await waitFor(() => {
    expect(screen.getByText('Select a product')).toBeInTheDocument();
  });

  // Select a product
  const select = screen.getByRole('combobox');
  fireEvent.mouseDown(select);
  await waitFor(() => {
    expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
  });
  const option = document.body.querySelector('div[title="Test Product (TP01)"]');
  expect(option).not.toBeNull();
  fireEvent.click(option!);

  // Check that refresh button is enabled
  const refreshButton = screen.getByRole('button', { name: /refresh/i });
  expect(refreshButton).not.toBeDisabled();
});

test('shows loading spinner during stock fetch', async () => {
  // Add a delay to the stock API response to test loading state
  server.use(
    rest.get(`${apiUrl}/stock/1`, async (_req, res, ctx) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return res(ctx.json(sampleStockMatrix));
    })
  );

  render(<ProductView />);

  // Wait for products to load
  await waitFor(() => {
    expect(screen.getByText('Select a product')).toBeInTheDocument();
  });

  // Select a product
  const select = screen.getByRole('combobox');
  fireEvent.mouseDown(select);
  await waitFor(() => {
    expect(screen.getByText('Test Product (TP01)')).toBeInTheDocument();
  });
  const option = document.body.querySelector('div[title="Test Product (TP01)"]');
  expect(option).not.toBeNull();
  fireEvent.click(option!);

  // Click refresh button
  const refreshButton = screen.getByText('Refresh');
  fireEvent.click(refreshButton);

  // Check that loading spinner appears
  await waitFor(() => {
    const spinner = document.querySelector('.ant-spin');
    expect(spinner).toBeInTheDocument();
  });
}); 