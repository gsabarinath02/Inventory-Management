import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Spin, Alert, Space, Tag } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridReadyEvent } from 'ag-grid-community';
import { motion } from 'framer-motion';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useStock } from '../../hooks/useStock';
import { useProducts } from '../../hooks/useProducts';
import { getColor } from '../../utils';
import ProductStatistics from '../../components/ProductStatistics';

const ProductView: React.FC = () => {
  const { products, fetchProducts } = useProducts();
  const { fetchStock, loading, error, stockMatrix } = useStock();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStock: 0, totalColors: 0, totalSizes: 0 });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (selectedProductId) {
      fetchStock(selectedProductId);
    }
  }, [selectedProductId, fetchStock]);

  useEffect(() => {
    if (stockMatrix) {
      const product = products.find(p => p.id === selectedProductId);
      if (product) {
        // Calculate stats
        const totalStock = Object.values(stockMatrix).reduce((acc, colorData) => acc + (colorData.total || 0), 0);
        const totalColors = product.colors.length;
        const totalSizes = product.sizes.length;
        setStats({ totalStock, totalColors, totalSizes });

        // Build Ag-Grid definitions
        const newColumnDefs: ColDef[] = [
          { headerName: 'Color', field: 'color', sortable: true, filter: true, pinned: 'left',
            cellRenderer: (params: any) => {
              return (
                <Tag color={getColor(params.value)} key={params.value}>
                  {params.value}
                </Tag>
              )
            }
          }
        ];

        product.sizes.forEach(size => {
          newColumnDefs.push({
            headerName: size,
            field: size,
            sortable: true,
            width: 100
          });
        });

        // Add the total column, pinned to the right
        newColumnDefs.push({
          headerName: 'Total',
          field: 'total',
          sortable: true,
          pinned: 'right',
          width: 100,
          cellStyle: { fontWeight: 'bold' }
        });

        setColumnDefs(newColumnDefs);

        // Build row data
        const newRowData = product.colors.map(color => {
          const row: any = { color };
          const colorData = stockMatrix[color] || {};
          product.sizes.forEach(size => {
            row[size] = colorData[size] || 0;
          });
          row.total = colorData.total || 0;
          return row;
        });
        setRowData(newRowData);
      }
    }
  }, [stockMatrix, products, selectedProductId]);

  const onGridReady = (params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <Card title="Product Stock Matrix">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Select
            showSearch
            style={{ width: 300 }}
            placeholder="Select a product"
            value={selectedProductId}
            onChange={(value) => setSelectedProductId(value)}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))}
            filterOption={(input, option) =>
              (option?.label as string).toLowerCase().includes(input.toLowerCase())
            }
          />
          <Button 
            type="primary" 
            onClick={() => selectedProductId && fetchStock(selectedProductId)} 
            disabled={!selectedProductId || loading}
          >
            Refresh
          </Button>
        </Space>

        {selectedProductId && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <ProductStatistics
                    totalStock={stats.totalStock}
                    totalColors={stats.totalColors}
                    totalSizes={stats.totalSizes}
                    loading={loading}
                />
            </motion.div>
        )}
        
        {error && (
          <Alert 
            message="Error" 
            description={error} 
            type="error" 
            showIcon 
            closable 
          />
        )}
        <Spin spinning={loading}>
          {rowData.length > 0 && (
            <motion.div 
                className="ag-theme-alpine" 
                style={{ height: 400, width: '100%' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AgGridReact
                columnDefs={columnDefs}
                rowData={rowData}
                onGridReady={onGridReady}
                pagination={false}
                animateRows={true}
                suppressRowClickSelection={true}
                suppressCellFocus={true}
              />
            </motion.div>
          )}
        </Spin>
      </Space>
    </Card>
  );
};

export default ProductView; 