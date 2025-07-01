import { useState, useEffect, useCallback } from 'react';
import { pendingOrdersAPI } from '../services/api';
import { Order } from '../types'; // If you have a PendingOrder type, use it here
import { showError } from '../utils';

export const usePendingOrders = (productId: number | null) => {
    const [logs, setLogs] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (customFilters?: Record<string, any>) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        setLoading(true);
        setError(null);
        try {
            const response = await pendingOrdersAPI.getAll(productId, customFilters);
            setLogs(response.data);
        } catch (err) {
            setError('Failed to fetch pending orders.');
            showError('Failed to fetch pending orders.');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    // The rest of the CRUD functions can be implemented if needed

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, fetchLogs };
}; 