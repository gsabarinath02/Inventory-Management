import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';

interface ProductStatisticsProps {
  totalStock: number;
  totalColors: number;
  totalSizes: number;
  loading?: boolean;
}

const ProductStatistics: React.FC<ProductStatisticsProps> = ({ 
    totalStock, 
    totalColors, 
    totalSizes, 
    loading = false 
}) => {
  return (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={8}>
        <Card>
          <Statistic 
            title="Total Stock" 
            value={totalStock} 
            loading={loading}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic 
            title="Available Colors" 
            value={totalColors} 
            loading={loading}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card>
          <Statistic 
            title="Available Sizes" 
            value={totalSizes}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProductStatistics; 