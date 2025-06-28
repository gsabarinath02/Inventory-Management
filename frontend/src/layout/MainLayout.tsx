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
  BellOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
  TeamOutlined
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
      case 'UserAddOutlined':
        return <UserAddOutlined />;
      case 'TeamOutlined':
        return <TeamOutlined />;
      default:
        return null;
    }
  };

  const getMainMenuItems = () => {
    const baseItems = Array.isArray(NAVIGATION.MENU_ITEMS) ? NAVIGATION.MENU_ITEMS.map((item) => ({
      key: item.key,
      icon: getIcon(item.icon),
      label: item.label,
      adminOnly: (item as any).adminOnly,
    })) : [];
    return baseItems.filter(item => {
      if (item.adminOnly && user?.role !== 'admin') return false;
      return true;
    });
  };

  const getBottomMenuItems = () => {
    if (user?.role === 'admin') {
      return [
        {
          key: '/users',
          icon: <TeamOutlined />,
          label: 'User Management',
        },
        {
          key: '/activity-logs',
          icon: <AuditOutlined />,
          label: 'Activity Logs',
        },
      ];
    }
    return [];
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
      <Sider width={200} theme="dark" collapsed={collapsed} style={{
        background: 'linear-gradient(135deg, #172A53 0%, #23376B 100%)',
        transition: 'background 0.5s',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}>
        <div
          style={{
            height: 80,
            margin: 16,
            background: 'transparent',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          <img
            src="/Backstitch-logo.svg"
            alt="Backstitch Logo"
            style={{
              height: 56,
              width: 56,
              objectFit: 'contain',
              background: 'none',
              boxShadow: 'none',
              borderRadius: 0,
              transition: 'margin 0.3s'
            }}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['/']}
            selectedKeys={[location.pathname]}
            style={{ borderRight: 0, background: 'transparent', flex: '0 0 auto' }}
            items={getMainMenuItems()}
            onClick={handleMenuClick}
            theme="dark"
            inlineIndent={16}
          />
          <div style={{ marginTop: 'auto' }}>
            <div style={{ borderTop: '1px solid #23376B', margin: '16px 0 0 0' }} />
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              style={{ borderRight: 0, background: 'transparent' }}
              items={getBottomMenuItems()}
              onClick={handleMenuClick}
              theme="dark"
              inlineIndent={16}
            />
          </div>
        </div>
      </Sider>
      <Layout style={{ background: '#f0f2f5' }}>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(23,42,83,0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64, marginRight: '16px', color: '#172A53' }}
            />
            <h1 style={{ margin: 0, color: '#172A53', fontWeight: 700, fontSize: 24, letterSpacing: 1 }}>
              Inventory Management System
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button type="text" icon={<BellOutlined />} style={{ fontSize: 20, color: '#172A53' }} aria-label="Notifications" />
            <Button type="text" icon={<QuestionCircleOutlined />} style={{ fontSize: 20, color: '#D4A12A' }} aria-label="Help" />
            {user && (
              <Dropdown menu={{ items: userMenuItems, style: menuStyle }} placement="bottomRight">
                <a onClick={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <Avatar style={{ backgroundColor: '#D4A12A', marginRight: 8, color: '#172A53', fontWeight: 700 }} icon={<UserOutlined />} />
                  <Text strong style={{ color: '#172A53' }}>{user.name || user.email}</Text>
                </a>
              </Dropdown>
            )}
          </div>
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