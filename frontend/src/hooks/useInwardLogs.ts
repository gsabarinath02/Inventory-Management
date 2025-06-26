import { useState, useEffect, useCallback } from 'react';
import { inwardAPI } from '../services/api';
import { InwardLog } from '../types';
import { showError, showSuccess } from '../utils';

export const useInwardLogs = (productId: number | null) => {
    const [logs, setLogs] = useState<InwardLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async (customFilters?: Record<string, any>) => {
        if (!productId) return;
        setLoading(true);
        setError(null);
        try {
            const response = await inwardAPI.getAll(productId, customFilters);
            setLogs(response.data);
        } catch (err) {
            setError('Failed to fetch inward logs.');
            showError('Failed to fetch inward logs.');
        } finally {
            setLoading(false);
        }
    }, [productId]);

    const createLog = async (log: InwardLog) => {
        try {
            await inwardAPI.create(log);
            showSuccess('Log created successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to create log.');
        }
    };

    const updateLog = async (id: number, log: InwardLog) => {
        try {
            await inwardAPI.update(id, log);
            showSuccess('Log updated successfully.');
            fetchLogs();
        } catch (err) {
            showError('Failed to update log.');
        }
    };

    const deleteLog = async (id: number) => {
        try {
            await inwardAPI.delete(id);
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