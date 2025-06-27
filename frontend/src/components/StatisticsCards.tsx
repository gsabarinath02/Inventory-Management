import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { Product } from '../types';
import { calculateTotalValue } from '../utils';
import { BarChartOutlined, DollarOutlined, StarOutlined, CheckCircleOutlined } from '@ant-design/icons';

interface StatisticsCardsProps {
  products: Product[];
  loading?: boolean;
}

const StatisticsCards: React.FC<StatisticsCardsProps> = ({ products, loading = false }) => {
  const totalValue = calculateTotalValue(products);

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Card style={{
          background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><BarChartOutlined /> Total Products</span>}
            value={products.length}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{
          background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><DollarOutlined /> Total Value</span>}
            value={totalValue}
            prefix="₹"
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{
          background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><StarOutlined /> Average Price</span>}
            value={products.length > 0 ? totalValue / products.length : 0}
            prefix="₹"
            precision={2}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card style={{
          background: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><CheckCircleOutlined /> Active Products</span>}
            value={products.filter(p => p.unit_price > 0).length}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default StatisticsCards; 