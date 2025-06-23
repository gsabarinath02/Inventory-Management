import { useState, useEffect } from 'react';
import { getUsers } from '../services/api'; 
import { User } from '../types/auth';

export const useUsers = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Assuming getUsers fetches all users for the dropdown
                const userList = await getUsers();
                setUsers(userList);
            } catch (error) {
                console.error("Failed to fetch users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, loading };
}; 