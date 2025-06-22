import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import ProductList from './features/products/ProductList';
import ProductView from './features/products/ProductView';
import Upload from './features/upload/Upload';

const App: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product-view" element={<ProductView />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </MainLayout>
  );
};

export default App; 