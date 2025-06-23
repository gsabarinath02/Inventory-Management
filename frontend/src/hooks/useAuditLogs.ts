import { useState, useCallback } from 'react';
import { getAuditLogs, deleteAuditLog, bulkDeleteAuditLogs } from '../services/api';
import { AuditLog } from '../types';

export const useAuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

    const fetchLogs = useCallback(async (filters: any, page: number, pageSize: number) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...filters,
                skip: (page - 1) * pageSize,
                limit: pageSize,
            };
            // Remove null/undefined filters
            Object.keys(params).forEach(key => {
                if (params[key] == null || params[key] === '') {
                    delete params[key];
                }
            });

            const data = await getAuditLogs(params);
            setLogs(data);
            // In a real scenario, the API should return total count.
            // setPagination(prev => ({ ...prev, total: data.totalCount }));
        } catch (err) {
            setError('Failed to fetch audit logs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteLog = useCallback(async (logId: number, filters: any, page: number, pageSize: number) => {
        await deleteAuditLog(logId);
        await fetchLogs(filters, page, pageSize);
    }, [fetchLogs]);

    const bulkDeleteLogs = useCallback(async (logIds: number[], filters: any, page: number, pageSize: number) => {
        await bulkDeleteAuditLogs(logIds);
        await fetchLogs(filters, page, pageSize);
    }, [fetchLogs]);

    return { logs, loading, error, pagination, fetchLogs, setPagination, deleteLog, bulkDeleteLogs };
}; 