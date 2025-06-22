import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  ShoppingCartOutlined, 
  BarChartOutlined,
  UploadOutlined 
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAVIGATION } from '../constants';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCartOutlined':
        return <ShoppingCartOutlined />;
      case 'BarChartOutlined':
        return <BarChartOutlined />;
      case 'UploadOutlined':
        return <UploadOutlined />;
      default:
        return null;
    }
  };

  const menuItems = NAVIGATION.MENU_ITEMS.map(item => ({
    key: item.key,
    icon: getIcon(item.icon),
    label: item.label,
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6 }} />
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          selectedKeys={[location.pathname]}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ background: '#f0f2f5' }}>
        <Header style={{ padding: 0, background: '#fff' }}>
          <h1 style={{ margin: '0 24px', color: '#1890ff', fontWeight: 600 }}>
            Inventory Management System
          </h1>
        </Header>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{ padding: 24, background: '#fff', minHeight: '85vh' }}
            >
                {children}
            </motion.div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 