import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import MainLayout from './layout/MainLayout';
import ProductList from './features/products/ProductList';
import ProductView from './features/products/ProductView';
import Upload from './features/upload/Upload';
import Login from './pages/Login';
import UserManagement from './pages/UserManagement';
import ActivityLogsPage from './pages/ActivityLogs';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout>
            <ProductList />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/product-view" element={
        <ProtectedRoute>
          <MainLayout>
            <ProductView />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/upload" element={
        <ProtectedRoute>
          <MainLayout>
            <Upload />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/users" element={
        <ProtectedRoute requiredRole="admin">
          <MainLayout>
            <UserManagement />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/activity-logs" element={
        <ProtectedRoute requiredRole="admin">
          <MainLayout>
            <ActivityLogsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App; 