import { useState, useCallback } from 'react';
import { StockMatrix, DetailedStockData, StockAPIResponse } from '../types';
import { stockAPI } from '../services/api';
import { showError } from '../utils';

export const useStock = () => {
  const [stockMatrix, setStockMatrix] = useState<StockMatrix | null>(null);
  const [detailedStock, setDetailedStock] = useState<DetailedStockData | null>(null);
  const [stockResponse, setStockResponse] = useState<StockAPIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(async (productId: number): Promise<StockMatrix | null> => {
    if (!productId) {
      setStockMatrix(null);
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.get(productId);
      setStockMatrix(response.data);
      return response.data;
    } catch (err) {
      const msg = 'Failed to fetch stock matrix.';
      setError(msg);
      showError(err, msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDetailedStock = useCallback(async (productId: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await stockAPI.getDetailed(productId);
      setDetailedStock(response.data);
      return response.data;
    } catch (error) {
      const errorMessage = 'Failed to fetch detailed stock data';
      setError(errorMessage);
      showError(error, errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStockData = useCallback(() => {
    setStockMatrix(null);
    setDetailedStock(null);
    setStockResponse(null);
    setError(null);
  }, []);

  return {
    stockMatrix,
    detailedStock,
    stockResponse,
    loading,
    error,
    fetchStock,
    fetchDetailedStock,
    clearStockData,
  };
}; 