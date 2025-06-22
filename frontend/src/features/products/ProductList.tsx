import React, { useState } from 'react';
import { Button, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useProducts } from '../../hooks/useProducts';
import { Product } from '../../types';
import ProductModal from '../../components/ProductModal';
import StatisticsCards from '../../components/StatisticsCards';
import { formatDate, getColor } from '../../utils';
import { GRID_CONFIG } from '../../constants';

const ProductList: React.FC = () => {
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
    await deleteProduct(id);
  };

  const columnDefs: ColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'sku', headerName: 'SKU', width: 150 },
    { field: 'unit_price', headerName: 'Unit Price', width: 120, valueFormatter: params => `$${params.value}` },
    { 
      field: 'sizes', 
      headerName: 'Sizes', 
      width: 180,
      cellRenderer: (params: any) => (
        <Space wrap size={[0, 8]}>
          {params.value?.map((size: string) => (
            <Tag key={size}>{size}</Tag>
          ))}
        </Space>
      ),
      valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : params.value,
    },
    { 
      field: 'colors', 
      headerName: 'Colors', 
      width: 180, 
      cellRenderer: (params: any) => (
        <Space wrap size={[0, 8]}>
         {params.value?.map((color: string) => (
           <Tag key={color} color={getColor(color)}>{color}</Tag>
         ))}
       </Space>
     ),
     valueFormatter: params => Array.isArray(params.value) ? params.value.join(', ') : params.value,
    },
    { field: 'created_at', headerName: 'Created', width: 150, valueFormatter: (params: any) => formatDate(params.value) },
    {
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
    },
  ];

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div>
      <StatisticsCards products={products} loading={loading} />
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Add Product
          </Button>
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
          onGridReady={onGridReady}
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