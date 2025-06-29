import { useState, useEffect, useCallback } from 'react';
import { ordersAPI } from '../services/api';
import { Order } from '../types';
import { showError, showSuccess } from '../utils';

export const useOrders = (productId: number | null) => {
    const [logs, setLogs] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (customFilters?: Record<string, any>) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        setLoading(true);
        setError(null);
        try {
            const response = await ordersAPI.getAll(productId, customFilters);
            setLogs(response.data);
        } catch (err) {
            setError('Failed to fetch orders.');
            showError('Failed to fetch orders.');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const createLog = async (log: Partial<Order>) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        try {
            await ordersAPI.create(log);
            showSuccess('Order created successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to create order.');
        }
    };

    const createLogsBulk = async (logs: Partial<Order>[]) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        try {
            await ordersAPI.createBulk(logs);
            showSuccess(`${logs.length} orders created successfully.`);
            fetchLogs();
        } catch (err) {
            showError('Failed to create orders in bulk.');
        }
    };

    const deleteLogsBulk = async (date?: string, store_name?: string) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        try {
            await ordersAPI.deleteBulk(productId, date, store_name);
            showSuccess('Orders deleted successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to delete orders in bulk.');
        }
    };

    const updateLog = async (id: number, log: Partial<Order>) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        // Remove fields not allowed in update
        const { id: _id, created_at, ...updatePayload } = log;
        try {
            await ordersAPI.update(id, updatePayload);
            showSuccess('Order updated successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to update order.');
        }
    };

    const deleteLog = async (id: number) => {
        if (!productId || typeof productId !== 'number' || isNaN(productId)) return;
        try {
            await ordersAPI.delete(id);
            showSuccess('Order deleted successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to delete order.');
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, fetchLogs, createLog, createLogsBulk, deleteLogsBulk, updateLog, deleteLog };
}; 