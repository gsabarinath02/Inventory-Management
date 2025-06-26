import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { Product } from '../types';
import { calculateTotalValue } from '../utils';

interface StatisticsCardsProps {
  products: Product[];
  loading?: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ products, loading = false }) => {
  const totalValue = calculateTotalValue(products);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Total Products" 
            value={products.length} 
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Total Value" 
            value={totalValue} 
            prefix="₹" 
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Average Price" 
            value={products.length > 0 ? totalValue / products.length : 0} 
            prefix="₹" 
            precision={2}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card>
          <Statistic 
            title="Active Products" 
            value={products.filter(p => p.unit_price > 0).length} 
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatisticsCards; 