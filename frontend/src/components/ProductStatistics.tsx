import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';
import { AppstoreOutlined, BgColorsOutlined, FontSizeOutlined } from '@ant-design/icons';

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
        <Card style={{
          background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><AppstoreOutlined /> Total Stock</span>}
            value={totalStock}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card style={{
          background: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><BgColorsOutlined /> Available Colors</span>}
            value={totalColors}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
      <Col span={8}>
        <Card style={{
          background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
          boxShadow: '0 4px 24px rgba(23,105,170,0.08)',
          border: 'none',
          transition: 'box-shadow 0.2s',
          cursor: 'pointer',
        }} hoverable>
          <Statistic
            title={<span style={{ fontWeight: 600, color: '#1769aa' }}><FontSizeOutlined /> Available Sizes</span>}
            value={totalSizes}
            loading={loading}
            valueStyle={{ fontWeight: 700, fontSize: 28, color: '#222' }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ProductStatistics; 