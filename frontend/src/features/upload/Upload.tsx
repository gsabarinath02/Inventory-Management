import React, { useState } from 'react';
import { Select, Typography, Divider, Radio } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../../hooks/useProducts';
import InwardLogTable from './InwardLogTable';
import SalesLogTable from './SalesLogTable';
import { Product } from '../../types';

const { Title, Text } = Typography;
const { Option } = Select;

const Upload: React.FC = () => {
    const { products, loading: productsLoading } = useProducts();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedLogType, setSelectedLogType] = useState<string | null>(null);

    const handleProductChange = (value: number) => {
        const product = products.find(p => p.id === value);
        setSelectedProduct(product || null);
        setSelectedLogType(null); 
    };

    const handleLogTypeChange = (e: any) => {
        setSelectedLogType(e.target.value);
    };
    
    // This function will be passed to the log tables to trigger a re-fetch of the stock matrix
    const handleDataChange = () => {
        // In the future, if we need to refresh data, we can add logic here.
        // For now, it serves as a placeholder for data consistency.
    };

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Manage Product Data</Title>
            <Text>Select a product to view and manage its inward/sales logs and stock.</Text>
            
            <div style={{ marginTop: '24px' }}>
                <Select
                    showSearch
                    style={{ width: 300 }}
                    placeholder="Select a product"
                    optionFilterProp="children"
                    onChange={handleProductChange}
                    loading={productsLoading}
                    value={selectedProduct?.id}
                    filterOption={(input, option) =>
                        (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {products.map(p => <Option key={p.id} value={p.id}>{`${p.name} (${p.sku})`}</Option>)}
                </Select>
            </div>

            {selectedProduct && (
                <>
                    <Divider />
                    <Radio.Group onChange={handleLogTypeChange} value={selectedLogType} style={{ marginBottom: 16 }}>
                        <Radio.Button value="inward">Inward Log</Radio.Button>
                        <Radio.Button value="sales">Sales Log</Radio.Button>
                    </Radio.Group>

                    <AnimatePresence mode="wait">
                        {selectedLogType === 'inward' && (
                            <motion.div
                                key="inward"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Title level={4}>Inward Log</Title>
                                <InwardLogTable 
                                    productId={selectedProduct.id} 
                                    onDataChange={handleDataChange}
                                    availableColors={selectedProduct.colors}
                                    availableSizes={selectedProduct.sizes}
                                />
                            </motion.div>
                        )}

                        {selectedLogType === 'sales' && (
                            <motion.div
                                key="sales"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Title level={4}>Sales Log</Title>
                                <SalesLogTable 
                                    productId={selectedProduct.id} 
                                    onDataChange={handleDataChange} 
                                    availableColors={selectedProduct.colors}
                                    availableSizes={selectedProduct.sizes}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
};

export default Upload; 