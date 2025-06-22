import { useState, useEffect, useCallback } from 'react';
import { Product, ProductFormData } from '../types';
import { productAPI } from '../services/api';
import { showError, showSuccess } from '../utils';
import { MESSAGES } from '../constants';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      const errorMessage = MESSAGES.ERROR.FETCH_PRODUCTS;
      setError(errorMessage);
      showError(error, errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (productData: ProductFormData) => {
    try {
      await productAPI.create(productData);
      showSuccess(MESSAGES.SUCCESS.PRODUCT_CREATED);
      await fetchProducts();
      return true;
    } catch (error) {
      showError(error, MESSAGES.ERROR.CREATE_PRODUCT);
      return false;
    }
  }, [fetchProducts]);

  const updateProduct = useCallback(async (id: number, productData: ProductFormData) => {
    try {
      await productAPI.update(id, productData);
      showSuccess(MESSAGES.SUCCESS.PRODUCT_UPDATED);
      await fetchProducts();
      return true;
    } catch (error) {
      showError(error, MESSAGES.ERROR.UPDATE_PRODUCT);
      return false;
    }
  }, [fetchProducts]);

  const deleteProduct = useCallback(async (id: number | string) => {
    const numericId = typeof id === 'string' ? parseInt(id.split(':')[0], 10) : id;
    
    if (isNaN(numericId)) {
      showError(null, MESSAGES.ERROR.INVALID_ID);
      return false;
    }

    try {
      await productAPI.delete(numericId);
      showSuccess(MESSAGES.SUCCESS.PRODUCT_DELETED);
      await fetchProducts();
      return true;
    } catch (error) {
      showError(error, MESSAGES.ERROR.DELETE_PRODUCT);
      return false;
    }
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}; 