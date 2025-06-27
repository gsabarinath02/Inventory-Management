import React, { useState, useMemo } from 'react';
import { Button, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types';
import ProductModal from '../../components/ProductModal';
import StatisticsCards from '../../components/StatisticsCards';
import { useAuth } from '../../context/AuthContext';
import { formatDate, getColor } from '../../utils';
import { GRID_CONFIG } from '../../constants';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const ProductList: React.FC = () => {
  const { user } = useAuth();
  const {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchProducts,
  } = useProducts();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const openEditModal = (product: Product) => {
    setModalError(null);
    setEditingProduct(product);
    setModalVisible(true);
  };

  const openCreateModal = () => {
    setModalError(null);
    setEditingProduct(null);
    setModalVisible(true);
  };

  const handleModalSubmit = async (values: any) => {
    setModalError(null);
    if (editingProduct) {
      const success = await updateProduct(editingProduct.id, values);
      if (success) setModalVisible(false);
    } else {
      const success = await createProduct(values);
      if (success) setModalVisible(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    console.debug('Raw ID received in handleDelete:', id, typeof id);
    const numericId = Number(String(id).replace(/[^0-9]/g, ''));
    console.debug('Sanitized numericId:', numericId);
    await deleteProduct(numericId);
  };

  const columnDefs: ColDef[] = useMemo(() => {
    const baseCols: ColDef[] = [
      { field: 'id', headerName: 'ID', width: 80 },
      { field: 'name', headerName: 'Name', flex: 1 },
      { field: 'sku', headerName: 'SKU', width: 150 },
      { field: 'unit_price', headerName: 'Unit Price', width: 120, valueFormatter: params => `₹${params.value}` },
      { 
        field: 'sizes', 
        headerName: 'Sizes', 
        width: 180,
        cellRenderer: (params: any) => (
          <Space wrap size={[0, 8]}>
            {Array.isArray(params.value) ? params.value.map((size: string) => (
              <Tag key={size}>{size}</Tag>
            )) : null}
          </Space>
        ),
        valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : params.value,
      },
      {
        headerName: 'Colour Code',
        field: 'colors',
        width: 120,
        valueGetter: params => Array.isArray(params.data.colors) ? params.data.colors.map((c: any) => c.colour_code).join(', ') : '',
        cellRenderer: (params: any) => (
          <Space wrap size={[0, 8]}>
            {Array.isArray(params.data.colors) ? params.data.colors.map((c: any) => (
              <Tag key={c.colour_code}>{c.colour_code}</Tag>
            )) : null}
          </Space>
        ),
      },
      {
        headerName: 'Color',
        field: 'colors',
        width: 180,
        valueGetter: params => Array.isArray(params.data.colors) ? params.data.colors.map((c: any) => c.color).join(', ') : '',
        cellRenderer: (params: any) => (
          <Space wrap size={[0, 8]}>
            {Array.isArray(params.data.colors) ? params.data.colors.map((c: any) => (
              <Tag key={c.color} color={getColor(c.color)} title={c.colour_code !== undefined ? `Code: ${c.colour_code}` : undefined}>
                {c.color}
              </Tag>
            )) : null}
          </Space>
        ),
      },
      { field: 'created_at', headerName: 'Created', width: 150, valueFormatter: (params: any) => formatDate(params.value) },
    ];

    if (user?.role !== 'viewer') {
      baseCols.push({
        headerName: 'Actions',
        width: 150,
        cellRenderer: (params: any) => (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openEditModal(params.data)}
            />
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(params.data.id)}
            />
          </Space>
        ),
      });
    }

    return baseCols;
  }, [user]);

  return (
    <div>
      <StatisticsCards products={products} loading={loading} />
      <div style={{ marginBottom: 16 }}>
        <Space>
          {user?.role !== 'viewer' && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreateModal}
            >
              Add Product
            </Button>
          )}
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProducts}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>
      <div className="ag-theme-alpine" style={{ height: GRID_CONFIG.DEFAULT_HEIGHT, width: '100%' }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={products}
          pagination={true}
          paginationPageSize={GRID_CONFIG.DEFAULT_PAGE_SIZE}
          paginationPageSizeSelector={[...GRID_CONFIG.PAGE_SIZE_OPTIONS]}
          animateRows={true}
        />
      </div>
      <ProductModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleModalSubmit}
        editingProduct={editingProduct}
        error={modalError}
      />
    </div>
  );
};

export default ProductList; 