import React from 'react';
import { Layout, Menu, Dropdown, Button, Space, Avatar, Typography, MenuProps } from 'antd';
import { 
  ShoppingCartOutlined, 
  BarChartOutlined,
  UploadOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AuditOutlined,
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
  const [collapsed, setCollapsed] = React.useState(false);

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
      baseItems.push({
        key: '/activity-logs',
        icon: <AuditOutlined />,
        label: 'Activity Logs',
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

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'username',
      disabled: true,
      label: (
        <Space>
          <UserOutlined />
          {user?.name || user?.email}
        </Space>
      )
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space onClick={handleLogout}>
          <LogoutOutlined />
          Logout
        </Space>
      )
    }
  ];

  const menuStyle = {
    width: 256,
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} theme="dark" collapsed={collapsed}>
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
          {collapsed ? 'IMS' : 'Inventory System'}
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
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                    fontSize: '16px',
                    width: 64,
                    height: 64,
                    marginRight: '16px'
                }}
            />
            <h1 style={{ margin: 0, color: '#1890ff', fontWeight: 600 }}>
              Inventory Management System
            </h1>
          </div>
          {user && (
            <Dropdown menu={{ items: userMenuItems, style: menuStyle }} placement="bottomRight">
              <a onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <Avatar style={{ backgroundColor: '#f56a00', marginRight: 8 }} icon={<UserOutlined />} />
                <Text strong>{user.name || user.email}</Text>
              </a>
            </Dropdown>
          )}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
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