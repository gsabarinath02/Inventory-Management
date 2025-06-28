import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../context/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockApi = api as jest.Mocked<typeof api>;

const wrapper = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

describe('useProducts Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should start with initial state', () => {
    const { result } = renderHook(() => useProducts(), { wrapper });
    expect(result.current.products).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.refetch).toBeDefined();
  });

  describe('Data Fetching', () => {
    it('should fetch products successfully', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', sku: 'SKU1' },
        { id: 2, name: 'Product 2', sku: 'SKU2' },
      ];
      
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.error).toBe(null);
      expect(mockApi.productAPI.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch products';
      mockApi.productAPI.getAll.mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      mockApi.productAPI.getAll.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('Network error');
    });
  });

  describe('Refetch Functionality', () => {
    it('should refetch data when refetch is called', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', sku: 'SKU1' }];
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Clear mock to verify it's called again
      mockApi.productAPI.getAll.mockClear();
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      await result.current.refetch();
      
      expect(mockApi.productAPI.getAll).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during refetch', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', sku: 'SKU1' }];
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Mock error on refetch
      mockApi.productAPI.getAll.mockRejectedValue(new Error('Refetch error'));
      
      await result.current.refetch();
      
      await waitFor(() => {
        expect(result.current.error).toBe('Refetch error');
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading during initial fetch', () => {
      mockApi.productAPI.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      expect(result.current.loading).toBe(true);
    });

    it('should show loading during refetch', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', sku: 'SKU1' }];
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Mock delayed response for refetch
      mockApi.productAPI.getAll.mockImplementation(() => new Promise(() => {}));
      
      result.current.refetch();
      
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle different error types', async () => {
      const testCases = [
        { error: new Error('Standard error'), expected: 'Standard error' },
        { error: 'String error', expected: 'String error' },
        { error: { message: 'Object error' }, expected: 'Object error' },
        { error: null, expected: 'Unknown error' },
      ];

      for (const testCase of testCases) {
        mockApi.productAPI.getAll.mockRejectedValue(testCase.error);
        
        const { result } = renderHook(() => useProducts(), { wrapper });
        
        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });
        
        expect(result.current.error).toBe(testCase.expected);
      }
    });

    it('should clear error on successful refetch', async () => {
      // Initial error
      mockApi.productAPI.getAll.mockRejectedValue(new Error('Initial error'));
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe('Initial error');
      
      // Successful refetch
      const mockProducts = [{ id: 1, name: 'Product 1', sku: 'SKU1' }];
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      await result.current.refetch();
      
      await waitFor(() => {
        expect(result.current.error).toBe(null);
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency across renders', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', sku: 'SKU1' },
        { id: 2, name: 'Product 2', sku: 'SKU2' },
      ];
      
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result, rerender } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Rerender the hook
      rerender();
      
      expect(result.current.products).toEqual(mockProducts);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should not make unnecessary API calls on rerender', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', sku: 'SKU1' }];
      mockApi.productAPI.getAll.mockResolvedValue({ data: mockProducts });
      
      const { result, rerender } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      const initialCallCount = mockApi.productAPI.getAll.mock.calls.length;
      
      // Rerender multiple times
      rerender();
      rerender();
      rerender();
      
      expect(mockApi.productAPI.getAll).toHaveBeenCalledTimes(initialCallCount);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty product list', async () => {
      mockApi.productAPI.getAll.mockResolvedValue({ data: [] });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.products).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should handle large product lists', async () => {
      const largeProductList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        sku: `SKU${i + 1}`,
      }));
      
      mockApi.productAPI.getAll.mockResolvedValue({ data: largeProductList });
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.products).toHaveLength(1000);
      expect(result.current.products[0]).toEqual({ id: 1, name: 'Product 1', sku: 'SKU1' });
      expect(result.current.products[999]).toEqual({ id: 1000, name: 'Product 1000', sku: 'SKU1000' });
    });

    it('should handle API timeout', async () => {
      mockApi.productAPI.getAll.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );
      
      const { result } = renderHook(() => useProducts(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 200 });
      
      expect(result.current.error).toBe('Request timeout');
    });
  });
}); 