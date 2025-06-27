import axios from 'axios';
import { 
  Product, 
  StockMatrix, 
  DetailedStockData, 
  ProductFormData,
  InwardLog,
  SalesLog
} from '../types';
import { API_CONFIG, API_ENDPOINTS } from '../constants';

const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add authentication interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for handling auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Grouped API functions
export const productAPI = {
  getAll: () => api.get<Product[]>(API_ENDPOINTS.PRODUCTS),
  create: (data: ProductFormData) => api.post<Product>(API_ENDPOINTS.PRODUCTS, data),
  update: (id: number, data: ProductFormData) => api.put<Product>(`${API_ENDPOINTS.PRODUCTS}/${id}`, data),
  delete: (id: number) => api.delete(`${API_ENDPOINTS.PRODUCTS}/${id}`),
};

export const stockAPI = {
  get: (productId: number) => api.get<StockMatrix>(`${API_ENDPOINTS.STOCK}/${productId}`),
  getDetailed: (productId: number) => api.get<DetailedStockData>(`${API_ENDPOINTS.STOCK}/${productId}/detailed`),
};

export const uploadAPI = {
  inward: (payload: { product_id: number; csv_text: string }) => api.post(API_ENDPOINTS.INWARD, payload),
  sales: (payload: { product_id: number; csv_text: string }) => api.post(API_ENDPOINTS.SALES, payload),
};

export const inwardAPI = {
  getAll: (productId: number, filters?: Record<string, any>) => api.get<InwardLog[]>(`${API_ENDPOINTS.INWARD}/${productId}`, { params: filters }),
  create: (data: Partial<InwardLog>) => api.post<InwardLog>(API_ENDPOINTS.INWARD, data),
  createBulk: (data: Partial<InwardLog>[]) => api.post<InwardLog[]>(`${API_ENDPOINTS.INWARD}/bulk-create`, data),
  update: (logId: number, data: Partial<InwardLog>) => api.put<InwardLog>(`${API_ENDPOINTS.INWARD}/${logId}`, data),
  delete: (logId: number) => api.delete(`${API_ENDPOINTS.INWARD}/${logId}`),
  deleteBulk: (productId: number, date?: string, stakeholder_name?: string) => 
    api.delete(`${API_ENDPOINTS.INWARD}/bulk-delete`, { 
      params: { product_id: productId, date, stakeholder_name } 
    }),
};

export const salesAPI = {
  getAll: (productId: number, filters?: Record<string, any>) => api.get<SalesLog[]>(`${API_ENDPOINTS.SALES}/${productId}`, { params: filters }),
  create: (data: Partial<SalesLog>) => {
    console.log('[SALES-API] POST', API_ENDPOINTS.SALES, data);
    return api.post<SalesLog>(API_ENDPOINTS.SALES, data);
  },
  createBulk: (data: Partial<SalesLog>[]) => api.post<SalesLog[]>(`${API_ENDPOINTS.SALES}/bulk-create`, data),
  update: (logId: number, data: Partial<SalesLog>) => api.put<SalesLog>(`${API_ENDPOINTS.SALES}/${logId}`, data),
  delete: (logId: number) => api.delete(`${API_ENDPOINTS.SALES}/${logId}`),
  deleteBulk: (productId: number, date?: string, store_name?: string) => 
    api.delete(`${API_ENDPOINTS.SALES}/bulk-delete`, { 
      params: { product_id: productId, date, store_name } 
    }),
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users/');
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getSalesLogs = async (productId: number) => {
  try {
    const response = await api.get<SalesLog[]>(`${API_ENDPOINTS.SALES}/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching sales logs:", error);
    throw error;
  }
};

// Audit Log API
export const getAuditLogs = async (params: any) => {
  try {
    const response = await api.get('/audit-logs/', { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

export const deleteAuditLog = async (logId: number) => {
  try {
    const response = await api.delete(`/audit-logs/${logId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting audit log:", error);
    throw error;
  }
};

export const bulkDeleteAuditLogs = async (logIds: number[]) => {
  try {
    const response = await api.post(`/audit-logs/bulk-delete`, { log_ids: logIds });
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting audit logs:", error);
    throw error;
  }
};

export default api; 