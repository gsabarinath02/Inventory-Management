import { useState, useEffect, useCallback } from 'react';
import { salesAPI } from '../services/api';
import { SalesLog } from '../types';
import { showError, showSuccess } from '../utils';

export const useSalesLogs = (productId: number | null) => {
    const [logs, setLogs] = useState<SalesLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (customFilters?: Record<string, any>) => {
        if (!productId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await salesAPI.getAll(productId, customFilters);
            setLogs(response.data);
        } catch (err) {
            setError('Failed to fetch sales logs.');
            showError('Failed to fetch sales logs.');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const createLog = async (log: SalesLog) => {
        if (!productId) return;
        try {
            await salesAPI.create(log);
            showSuccess('Log created successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to create log.');
        }
    };

    const updateLog = async (id: number, log: SalesLog) => {
        try {
            await salesAPI.update(id, log);
            showSuccess('Log updated successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to update log.');
        }
    };

    const deleteLog = async (id: number) => {
        try {
            await salesAPI.delete(id);
            showSuccess('Log deleted successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to delete log.');
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, fetchLogs, createLog, updateLog, deleteLog };
}; 