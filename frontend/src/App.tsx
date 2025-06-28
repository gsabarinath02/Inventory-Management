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
import Registration from './pages/Registration';
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
      
      <Route path="/registration" element={
        <ProtectedRoute requiredRole="admin">
          <MainLayout>
            <Registration />
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
          colorPrimary: '#172A53',
          colorLink: '#172A53',
          colorSuccess: '#D4A12A',
          colorWarning: '#D4A12A',
          colorError: '#E53935',
          colorBgBase: '#F4F8FB',
          colorTextBase: '#172A53',
          borderRadius: 10,
          fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
        },
        components: {
          Card: {
            borderRadius: 14,
            boxShadow: '0 4px 24px rgba(23,42,83,0.08)',
          },
          Button: {
            borderRadius: 8,
            fontWeight: 600,
            colorPrimary: '#172A53',
            colorPrimaryHover: '#D4A12A',
            colorPrimaryActive: '#D4A12A',
          },
          Input: {
            borderRadius: 8,
            colorPrimary: '#172A53',
          },
          Modal: {
            borderRadius: 14,
          },
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