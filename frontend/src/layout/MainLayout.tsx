import React from 'react';
import { Layout, Menu, Dropdown, Button, Space, Avatar, Typography } from 'antd';
import { 
  ShoppingCartOutlined, 
  BarChartOutlined,
  UploadOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAVIGATION } from '../constants';
import { useAuth } from '../context/AuthContext';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingCartOutlined':
        return <ShoppingCartOutlined />;
      case 'BarChartOutlined':
        return <BarChartOutlined />;
      case 'UploadOutlined':
        return <UploadOutlined />;
      case 'UserOutlined':
        return <UserOutlined />;
      default:
        return null;
    }
  };

  const getMenuItems = () => {
    const baseItems: { key: string; icon: JSX.Element | null; label: string }[] =
      NAVIGATION.MENU_ITEMS.map((item) => ({
        key: item.key,
        icon: getIcon(item.icon),
        label: item.label,
      }));

    if (user?.role === 'admin') {
      baseItems.push({
        key: '/users',
        icon: <UserOutlined />,
        label: 'User Management',
      });
    }

    return baseItems;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const userDropdown = (
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
      <Button type="text" style={{ height: 'auto', padding: '8px 12px' }}>
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 500, color: '#1890ff' }}>
              {user?.name}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {user?.role?.toUpperCase()}
            </Text>
          </div>
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark">
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.2)', 
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 500
        }}>
          IMS
        </div>
        <Menu
          mode="inline"
          defaultSelectedKeys={['/']}
          selectedKeys={[location.pathname]}
          style={{ height: '100%', borderRight: 0 }}
          items={getMenuItems()}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout style={{ background: '#f0f2f5' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, color: '#1890ff', fontWeight: 600 }}>
            Inventory Management System
          </h1>
          {user && userDropdown}
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