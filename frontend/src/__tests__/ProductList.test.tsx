import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import ProductList from '../features/products/ProductList';
import '@testing-library/jest-dom';

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
  { id: 1, name: 'Shirt', sku: 'S1', unit_price: 10, sizes: ['S'], colors: ['Red'], created_at: new Date().toISOString() },
  { id: 2, name: 'Pants', sku: 'P1', unit_price: 20, sizes: ['M'], colors: ['Blue'], created_at: new Date().toISOString() },
];

const server = setupServer(
  rest.get(`${apiUrl}/products`, (_req, res, ctx) => {
    return res(ctx.json(sampleProducts));
  }),
  rest.post(`${apiUrl}/products`, async (req, res, ctx) => {
    const newProduct = await req.json();
    return res(ctx.json({ ...newProduct, id: 3 }));
  }),
  rest.put(`${apiUrl}/products/1`, (_req, res, ctx) => {
    return res(ctx.json({ ...sampleProducts[0], name: 'Updated Product' }));
  }),
  rest.delete(`${apiUrl}/products/1`, (_req, res, ctx) => {
    return res(ctx.status(204));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('renders product list from API', async () => {
  render(<ProductList />);
  expect(await screen.findByText('Shirt')).toBeInTheDocument();
  expect(screen.getByText('Pants')).toBeInTheDocument();
});

test('handles API error on fetch', async () => {
  server.use(rest.get(`${apiUrl}/products`, (req, res, ctx) => res(ctx.status(500))));
  render(<ProductList />);
  expect(await screen.findByText('Total Products')).toBeInTheDocument();
});

test('opens create modal when Add Product button is clicked', async () => {
  render(<ProductList />);
  const addButton = await screen.findByText('Add Product');
  fireEvent.click(addButton);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByLabelText('Name')).toBeInTheDocument();
});

test('creates product successfully', async () => {
  server.use(
    rest.post(`${apiUrl}/products`, (req, res, ctx) =>
      res(ctx.json({ id: 3, name: 'New Product', sku: 'NP001', unit_price: 15.99 }))
    )
  );

  render(<ProductList />);
  
  // Open create modal
  const addButton = await screen.findByText('Add Product');
  fireEvent.click(addButton);
  
  // Fill form
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Product' } });
  fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'NP001' } });
  fireEvent.change(screen.getByLabelText('Unit Price'), { target: { value: '15.99' } });
  
  // Submit form
  fireEvent.click(screen.getByText('Create'));
  
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('validates required fields on create', async () => {
  render(<ProductList />);
  
  // Open create modal
  const addButton = await screen.findByText('Add Product');
  fireEvent.click(addButton);
  
  // Try to submit without filling required fields
  fireEvent.click(screen.getByText('Create'));
  
  await waitFor(() => {
    expect(screen.getByText('Please enter product name')).toBeInTheDocument();
    expect(screen.getByText('Please enter SKU')).toBeInTheDocument();
    expect(screen.getByText('Please enter unit price')).toBeInTheDocument();
  });
});

test('shows AntD validation error for negative unit price', async () => {
  render(<ProductList />);
  
  // Open create modal
  const addButton = await screen.findByText('Add Product');
  fireEvent.click(addButton);
  
  // Fill form with negative price
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Product' } });
  fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'TP001' } });
  fireEvent.change(screen.getByLabelText('Unit Price'), { target: { value: '-10' } });
  
  // Submit form
  fireEvent.click(screen.getByText('Create'));
  
  await waitFor(() => {
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    // AntD validation error for negative values
    expect(within(modal).getByText('Please enter unit price')).toBeInTheDocument();
  });
});

test('shows backend error in modal for valid input', async () => {
  server.use(
    rest.post(`${apiUrl}/products`, (req, res, ctx) =>
      res(ctx.status(422), ctx.json({ detail: 'Unit price must be >= 0' }))
    )
  );

  render(<ProductList />);

  // Open create modal
  const addButton = await screen.findByText('Add Product');
  fireEvent.click(addButton);

  // Fill form with valid (positive) price
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test Product' } });
  fireEvent.change(screen.getByLabelText('SKU'), { target: { value: 'TP001' } });
  fireEvent.change(screen.getByLabelText('Unit Price'), { target: { value: '10' } });

  // Submit form
  fireEvent.click(screen.getByText('Create'));

  await waitFor(() => {
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('Unit price must be >= 0')).toBeInTheDocument();
  });
});

test('displays total products count', async () => {
  render(<ProductList />);
  expect(await screen.findByText('Total Products')).toBeInTheDocument();
  // Wait for the API call to complete and check the statistic
  await waitFor(() => {
    const totalProductsElement = screen.getByText('Total Products').closest('.ant-card')?.querySelector('.ant-statistic-content-value-int');
    expect(totalProductsElement).toHaveTextContent('2');
  });
});

test('displays total value', async () => {
  render(<ProductList />);
  expect(await screen.findByText('Total Value')).toBeInTheDocument();
  // Wait for the API call to complete and check the statistic
  await waitFor(() => {
    const totalValueElement = screen.getByText('Total Value').closest('.ant-card')?.querySelector('.ant-statistic-content-value-int');
    expect(totalValueElement).toHaveTextContent('30');
  });
});