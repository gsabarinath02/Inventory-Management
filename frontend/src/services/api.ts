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
  getAll: (productId: number) => api.get<InwardLog[]>(`${API_ENDPOINTS.INWARD}/${productId}`),
  create: (data: InwardLog) => api.post<InwardLog>(API_ENDPOINTS.INWARD, data),
  update: (logId: number, data: InwardLog) => api.put<InwardLog>(`${API_ENDPOINTS.INWARD}/${logId}`, data),
  delete: (logId: number) => api.delete(`${API_ENDPOINTS.INWARD}/${logId}`),
};

export const salesAPI = {
  getAll: (productId: number) => api.get<SalesLog[]>(`${API_ENDPOINTS.SALES}/${productId}`),
  create: (data: SalesLog) => api.post<SalesLog>(API_ENDPOINTS.SALES, data),
  update: (logId: number, data: SalesLog) => api.put<SalesLog>(`${API_ENDPOINTS.SALES}/${logId}`, data),
  delete: (logId: number) => api.delete(`${API_ENDPOINTS.SALES}/${logId}`),
};

export default api; 