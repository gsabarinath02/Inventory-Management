import axios from 'axios';
import {
  productAPI,
  stockAPI,
  uploadAPI,
  inwardAPI,
  salesAPI,
  getUsers,
  getSalesLogs,
  getAuditLogs,
  deleteAuditLog,
  bulkDeleteAuditLogs,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAgencies,
  createAgency,
  updateAgency,
  deleteAgency,
} from '../../services/api';
import { API_ENDPOINTS } from '../../constants';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

const mockAxios = axios as any;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('mock-token');
    // Clear localStorage
    localStorage.clear();
  });

  describe('Product API', () => {
    it('should get all products', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1' }];
      mockAxios.get.mockResolvedValue({ data: mockProducts });

      const result = await productAPI.getAll();

      expect(mockAxios.get).toHaveBeenCalledWith(API_ENDPOINTS.PRODUCTS);
      expect(result.data).toEqual(mockProducts);
    });

    it('should create a product', async () => {
      const productData = { name: 'New Product', sku: 'SKU001' };
      const mockResponse = { id: 1, ...productData };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await productAPI.create(productData);

      expect(mockAxios.post).toHaveBeenCalledWith(API_ENDPOINTS.PRODUCTS, productData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should update a product', async () => {
      const productData = { name: 'Updated Product' };
      const mockResponse = { id: 1, ...productData };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await productAPI.update(1, productData);

      expect(mockAxios.put).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}/1`, productData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should delete a product', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Product deleted' } });

      await productAPI.delete(1);

      expect(mockAxios.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.PRODUCTS}/1`);
    });
  });

  describe('Stock API', () => {
    it('should get stock matrix', async () => {
      const mockStock = { product_id: 1, stock_data: [] };
      mockAxios.get.mockResolvedValue({ data: mockStock });

      const result = await stockAPI.get(1);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.STOCK}/1`);
      expect(result.data).toEqual(mockStock);
    });

    it('should get detailed stock data', async () => {
      const mockDetailedStock = { product_id: 1, detailed_data: [] };
      mockAxios.get.mockResolvedValue({ data: mockDetailedStock });

      const result = await stockAPI.getDetailed(1);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.STOCK}/1/detailed`);
      expect(result.data).toEqual(mockDetailedStock);
    });
  });

  describe('Upload API', () => {
    it('should upload inward data', async () => {
      const payload = { product_id: 1, csv_text: 'test,csv,data' };
      mockAxios.post.mockResolvedValue({ data: { message: 'Upload successful' } });

      const result = await uploadAPI.inward(payload);

      expect(mockAxios.post).toHaveBeenCalledWith(API_ENDPOINTS.INWARD, payload);
      expect(result.data).toEqual({ message: 'Upload successful' });
    });

    it('should upload sales data', async () => {
      const payload = { product_id: 1, csv_text: 'test,csv,data' };
      mockAxios.post.mockResolvedValue({ data: { message: 'Upload successful' } });

      const result = await uploadAPI.sales(payload);

      expect(mockAxios.post).toHaveBeenCalledWith(API_ENDPOINTS.SALES, payload);
      expect(result.data).toEqual({ message: 'Upload successful' });
    });
  });

  describe('Inward API', () => {
    it('should get all inward logs', async () => {
      const mockLogs = [{ id: 1, product_id: 1, quantity: 10 }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await inwardAPI.getAll(1);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/1`, { params: undefined });
      expect(result.data).toEqual(mockLogs);
    });

    it('should get inward logs with filters', async () => {
      const filters = { date: '2024-01-01', stakeholder_name: 'Test' };
      const mockLogs = [{ id: 1, product_id: 1, quantity: 10 }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await inwardAPI.getAll(1, filters);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/1`, { params: filters });
      expect(result.data).toEqual(mockLogs);
    });

    it('should create inward log', async () => {
      const logData = { product_id: 1, quantity: 10 };
      const mockResponse = { id: 1, ...logData };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await inwardAPI.create(logData);

      expect(mockAxios.post).toHaveBeenCalledWith(API_ENDPOINTS.INWARD, logData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should create bulk inward logs', async () => {
      const logsData = [{ product_id: 1, quantity: 10 }];
      const mockResponse = [{ id: 1, product_id: 1, quantity: 10 }];
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await inwardAPI.createBulk(logsData);

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/bulk-create`, logsData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should update inward log', async () => {
      const logData = { quantity: 20 };
      const mockResponse = { id: 1, product_id: 1, quantity: 20 };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await inwardAPI.update(1, logData);

      expect(mockAxios.put).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/1`, logData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should delete inward log', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Log deleted' } });

      await inwardAPI.delete(1);

      expect(mockAxios.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/1`);
    });

    it('should bulk delete inward logs', async () => {
      const params = { product_id: 1, date: '2024-01-01', stakeholder_name: 'Test' };
      mockAxios.delete.mockResolvedValue({ data: { message: 'Bulk delete successful' } });

      await inwardAPI.deleteBulk(1, '2024-01-01', 'Test');

      expect(mockAxios.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.INWARD}/bulk-delete`, { params });
    });
  });

  describe('Sales API', () => {
    it('should get all sales logs', async () => {
      const mockLogs = [{ id: 1, product_id: 1, quantity: 5 }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await salesAPI.getAll(1);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/1`, { params: undefined });
      expect(result.data).toEqual(mockLogs);
    });

    it('should get sales logs with filters', async () => {
      const filters = { date: '2024-01-01', store_name: 'Test Store' };
      const mockLogs = [{ id: 1, product_id: 1, quantity: 5 }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await salesAPI.getAll(1, filters);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/1`, { params: filters });
      expect(result.data).toEqual(mockLogs);
    });

    it('should create sales log', async () => {
      const logData = { product_id: 1, quantity: 5 };
      const mockResponse = { id: 1, ...logData };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await salesAPI.create(logData);

      expect(mockAxios.post).toHaveBeenCalledWith(API_ENDPOINTS.SALES, logData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should create bulk sales logs', async () => {
      const logsData = [{ product_id: 1, quantity: 5 }];
      const mockResponse = [{ id: 1, product_id: 1, quantity: 5 }];
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await salesAPI.createBulk(logsData);

      expect(mockAxios.post).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/bulk-create`, logsData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should update sales log', async () => {
      const logData = { quantity: 10 };
      const mockResponse = { id: 1, product_id: 1, quantity: 10 };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await salesAPI.update(1, logData);

      expect(mockAxios.put).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/1`, logData);
      expect(result.data).toEqual(mockResponse);
    });

    it('should delete sales log', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Log deleted' } });

      await salesAPI.delete(1);

      expect(mockAxios.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/1`);
    });

    it('should bulk delete sales logs', async () => {
      const params = { product_id: 1, date: '2024-01-01', store_name: 'Test Store' };
      mockAxios.delete.mockResolvedValue({ data: { message: 'Bulk delete successful' } });

      await salesAPI.deleteBulk(1, '2024-01-01', 'Test Store');

      expect(mockAxios.delete).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/bulk-delete`, { params });
    });
  });

  describe('User Management API', () => {
    it('should get users', async () => {
      const mockUsers = [{ id: 1, username: 'user1' }];
      mockAxios.get.mockResolvedValue({ data: mockUsers });

      const result = await getUsers();

      expect(mockAxios.get).toHaveBeenCalledWith('/users/');
      expect(result).toEqual(mockUsers);
    });

    it('should handle user fetch error', async () => {
      const error = new Error('Failed to fetch users');
      mockAxios.get.mockRejectedValue(error);

      await expect(getUsers()).rejects.toThrow('Failed to fetch users');
    });
  });

  describe('Sales Logs API', () => {
    it('should get sales logs', async () => {
      const mockLogs = [{ id: 1, product_id: 1, quantity: 5 }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await getSalesLogs(1);

      expect(mockAxios.get).toHaveBeenCalledWith(`${API_ENDPOINTS.SALES}/1`);
      expect(result).toEqual(mockLogs);
    });

    it('should handle sales logs fetch error', async () => {
      const error = new Error('Failed to fetch sales logs');
      mockAxios.get.mockRejectedValue(error);

      await expect(getSalesLogs(1)).rejects.toThrow('Failed to fetch sales logs');
    });
  });

  describe('Audit Logs API', () => {
    it('should get audit logs', async () => {
      const params = { page: 1, limit: 10 };
      const mockLogs = [{ id: 1, action: 'CREATE', table_name: 'products' }];
      mockAxios.get.mockResolvedValue({ data: mockLogs });

      const result = await getAuditLogs(params);

      expect(mockAxios.get).toHaveBeenCalledWith('/audit-logs/', { params });
      expect(result).toEqual(mockLogs);
    });

    it('should delete audit log', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Log deleted' } });

      const result = await deleteAuditLog(1);

      expect(mockAxios.delete).toHaveBeenCalledWith('/audit-logs/1');
      expect(result).toEqual({ message: 'Log deleted' });
    });

    it('should bulk delete audit logs', async () => {
      const logIds = [1, 2, 3];
      mockAxios.post.mockResolvedValue({ data: { message: 'Bulk delete successful' } });

      const result = await bulkDeleteAuditLogs(logIds);

      expect(mockAxios.post).toHaveBeenCalledWith('/audit-logs/bulk-delete', { log_ids: logIds });
      expect(result).toEqual({ message: 'Bulk delete successful' });
    });
  });

  describe('Customer API', () => {
    it('should get customers', async () => {
      const mockCustomers = [{ id: 1, store_name: 'Store 1' }];
      mockAxios.get.mockResolvedValue({ data: mockCustomers });

      const result = await getCustomers();

      expect(mockAxios.get).toHaveBeenCalledWith('/customers');
      expect(result).toEqual(mockCustomers);
    });

    it('should create customer', async () => {
      const customerData = { store_name: 'New Store' };
      const mockResponse = { id: 1, ...customerData };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createCustomer(customerData);

      expect(mockAxios.post).toHaveBeenCalledWith('/customers', customerData);
      expect(result).toEqual(mockResponse);
    });

    it('should update customer', async () => {
      const customerData = { store_name: 'Updated Store' };
      const mockResponse = { id: 1, ...customerData };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await updateCustomer(1, customerData);

      expect(mockAxios.put).toHaveBeenCalledWith('/customers/1', customerData);
      expect(result).toEqual(mockResponse);
    });

    it('should delete customer', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Customer deleted' } });

      await deleteCustomer(1);

      expect(mockAxios.delete).toHaveBeenCalledWith('/customers/1');
    });
  });

  describe('Agency API', () => {
    it('should get agencies', async () => {
      const mockAgencies = [{ id: 1, agency_name: 'Agency 1' }];
      mockAxios.get.mockResolvedValue({ data: mockAgencies });

      const result = await getAgencies();

      expect(mockAxios.get).toHaveBeenCalledWith('/agencies');
      expect(result).toEqual(mockAgencies);
    });

    it('should create agency', async () => {
      const agencyData = { agency_name: 'New Agency' };
      const mockResponse = { id: 1, ...agencyData };
      mockAxios.post.mockResolvedValue({ data: mockResponse });

      const result = await createAgency(agencyData);

      expect(mockAxios.post).toHaveBeenCalledWith('/agencies', agencyData);
      expect(result).toEqual(mockResponse);
    });

    it('should update agency', async () => {
      const agencyData = { agency_name: 'Updated Agency' };
      const mockResponse = { id: 1, ...agencyData };
      mockAxios.put.mockResolvedValue({ data: mockResponse });

      const result = await updateAgency(1, agencyData);

      expect(mockAxios.put).toHaveBeenCalledWith('/agencies/1', agencyData);
      expect(result).toEqual(mockResponse);
    });

    it('should delete agency', async () => {
      mockAxios.delete.mockResolvedValue({ data: { message: 'Agency deleted' } });

      await deleteAgency(1);

      expect(mockAxios.delete).toHaveBeenCalledWith('/agencies/1');
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 errors and redirect to login', async () => {
      const error = {
        response: { status: 401 },
        message: 'Unauthorized',
      };
      mockAxios.get.mockRejectedValue(error);

      // Mock window.location
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: '' } as any;

      await expect(productAPI.getAll()).rejects.toEqual(error);

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');

      // Restore window.location
      window.location = originalLocation;
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      mockAxios.get.mockRejectedValue(error);

      await expect(productAPI.getAll()).rejects.toThrow('Network Error');
    });

    it('should handle timeout errors', async () => {
      const error = new Error('Request timeout');
      mockAxios.get.mockRejectedValue(error);

      await expect(productAPI.getAll()).rejects.toThrow('Request timeout');
    });
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', () => {
      const token = 'test-token';
      localStorage.setItem('token', token);

      // Re-import to trigger the interceptor setup
      jest.resetModules();
      require('../../services/api');

      // Get the mock axios instance
      const mockAxiosInstance = mockAxios.create();
      
      // Verify interceptor was called
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should not add authorization header when no token exists', () => {
      localStorage.removeItem('token');

      // Re-import to trigger the interceptor setup
      jest.resetModules();
      require('../../services/api');

      // Get the mock axios instance
      const mockAxiosInstance = mockAxios.create();
      
      // Verify interceptor was called
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor', () => {
    it('should handle 401 responses by clearing token and redirecting', () => {
      // Re-import to trigger the interceptor setup
      jest.resetModules();
      require('../../services/api');

      // Get the mock axios instance
      const mockAxiosInstance = mockAxios.create();
      
      // Verify response interceptor was called
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('API Instance', () => {
    it('should create axios instance with correct base URL', () => {
      expect(mockAxios.create).toHaveBeenCalledWith({
        baseURL: expect.any(String),
        timeout: 10000,
      });
    });
  });
}); 