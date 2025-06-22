import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'viewer';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRequiredRole(user.role, requiredRole)) {
    return (
      fallback || (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <p>Required role: {requiredRole}</p>
          <p>Your role: {user.role}</p>
        </div>
      )
    );
  }

  return <>{children}</>;
};

const hasRequiredRole = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
}; 