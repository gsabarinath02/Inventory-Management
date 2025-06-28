import React, { useEffect, useState } from 'react';
import { Tabs, Table, Button, Modal, Form, Input, Select, notification, Space, Alert, Card, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PhoneOutlined, HomeOutlined, NumberOutlined, ShopOutlined, TeamOutlined, EnvironmentOutlined, BarcodeOutlined, EyeOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { Customer, Agency } from '../types';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getAgencies, createAgency, updateAgency, deleteAgency } from '../services/api';
import { useNavigate } from 'react-router-dom';
import RegionMap from '../components/RegionMap';

const referrerOptions = ['Nagarajan', 'Krishna Pranav'];

const Registration: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('customers');

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm] = Form.useForm();
  const [customerLoading, setCustomerLoading] = useState(false);
  const [customerFormError, setCustomerFormError] = useState<string | null>(null);

  // Agency state
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyModalOpen, setAgencyModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [agencyForm] = Form.useForm();
  const [agencyLoading, setAgencyLoading] = useState(false);
  const [agencyFormError, setAgencyFormError] = useState<string | null>(null);

  const [viewingAgency, setViewingAgency] = useState<Agency | null>(null);
  const [viewAgencyModalOpen, setViewAgencyModalOpen] = useState(false);

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewCustomerModalOpen, setViewCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      notification.error({ message: 'Access Denied', description: 'Admins only.' });
      navigate('/');
      return;
    }
    fetchCustomers();
    fetchAgencies();
  }, [user, navigate]);

  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      notification.error({ message: 'Failed to fetch customers' });
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchAgencies = async () => {
    setAgencyLoading(true);
    try {
      const data = await getAgencies();
      setAgencies(data);
    } catch (error) {
      console.error('Error fetching agencies:', error);
      notification.error({ message: 'Failed to fetch agencies' });
    } finally {
      setAgencyLoading(false);
    }
  };

  // Customer CRUD
  const handleCustomerSubmit = async (values: any) => {
    try {
      setCustomerFormError(null);
      console.log('Submitting customer:', values);
      
      const payload = {
        ...values,
        store_name: String(values.store_name ?? '').trim(),
        referrer: String(values.referrer ?? ''),
        owner_mobile: String(values.owner_mobile ?? '').replace(/\D/g, ''),
        accounts_mobile: String(values.accounts_mobile ?? '').replace(/\D/g, ''),
        days_of_payment: Number(values.days_of_payment) || 0,
        gst_number: String(values.gst_number ?? '').toUpperCase(),
        address: String(values.address ?? '').trim(),
        pincode: String(values.pincode ?? '').replace(/\D/g, ''),
      };

      console.log('Payload to backend:', payload);
      
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, payload);
        notification.success({ message: 'Customer updated successfully' });
      } else {
        await createCustomer(payload);
        notification.success({ message: 'Customer created successfully' });
      }
      
      setCustomerModalOpen(false);
      setEditingCustomer(null);
      customerForm.resetFields();
      fetchCustomers();
    } catch (e: any) {
      console.error('Error submitting customer:', e);
      if (e?.response?.status === 422 && e?.response?.data?.detail) {
        const detail = e.response.data.detail;
        if (Array.isArray(detail)) {
          setCustomerFormError('Validation error: ' + detail[0]?.msg || 'Check your input.');
        } else {
          setCustomerFormError('Validation error: ' + detail);
        }
      } else if (e?.response?.status === 400) {
        setCustomerFormError(e?.response?.data?.detail || 'Bad request');
      } else {
        setCustomerFormError(e?.response?.data?.detail || 'Error saving customer');
      }
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustomerModalOpen(true);
    setCustomerFormError(null);
    customerForm.setFieldsValue(customer);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete ${customer.store_name}?`,
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteCustomer(customer.id);
          notification.success({ message: 'Customer deleted successfully' });
          fetchCustomers();
        } catch (error) {
          console.error('Error deleting customer:', error);
          notification.error({ message: 'Failed to delete customer' });
        }
      },
    });
  };

  // Agency CRUD
  const handleAgencySubmit = async (values: any) => {
    try {
      setAgencyFormError(null);
      console.log('Submitting agency:', values);
      
      const payload = {
        ...values,
        agency_name: String(values.agency_name ?? '').trim(),
        owner_mobile: String(values.owner_mobile ?? '').replace(/\D/g, ''),
        accounts_mobile: String(values.accounts_mobile ?? '').replace(/\D/g, ''),
        days_of_payment: Number(values.days_of_payment) || 0,
        gst_number: String(values.gst_number ?? '').toUpperCase(),
        address: String(values.address ?? '').trim(),
        pincode: String(values.pincode ?? '').replace(/\D/g, ''),
        region_covered: String(values.region_covered ?? '').trim(),
      };

      console.log('Payload to backend:', payload);
      
      if (editingAgency) {
        await updateAgency(editingAgency.id, payload);
        notification.success({ message: 'Agency updated successfully' });
      } else {
        await createAgency(payload);
        notification.success({ message: 'Agency created successfully' });
      }
      
      setAgencyModalOpen(false);
      setEditingAgency(null);
      agencyForm.resetFields();
      fetchAgencies();
    } catch (e: any) {
      console.error('Error submitting agency:', e);
      if (e?.response?.status === 422 && e?.response?.data?.detail) {
        const detail = e.response.data.detail;
        if (Array.isArray(detail)) {
          setAgencyFormError('Validation error: ' + detail[0]?.msg || 'Check your input.');
        } else {
          setAgencyFormError('Validation error: ' + detail);
        }
      } else if (e?.response?.status === 400) {
        setAgencyFormError(e?.response?.data?.detail || 'Bad request');
      } else {
        setAgencyFormError(e?.response?.data?.detail || 'Error saving agency');
      }
    }
  };

  const handleEditAgency = (agency: Agency) => {
    setEditingAgency(agency);
    setAgencyModalOpen(true);
    setAgencyFormError(null);
    agencyForm.setFieldsValue(agency);
  };

  const handleDeleteAgency = async (agency: Agency) => {
    Modal.confirm({
      title: 'Delete Agency',
      content: `Are you sure you want to delete ${agency.agency_name}?`,
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteAgency(agency.id);
          notification.success({ message: 'Agency deleted successfully' });
          fetchAgencies();
        } catch (error) {
          console.error('Error deleting agency:', error);
          notification.error({ message: 'Failed to delete agency' });
        }
      },
    });
  };

  const handleCustomerModalCancel = () => {
    setCustomerModalOpen(false);
    setEditingCustomer(null);
    customerForm.resetFields();
    setCustomerFormError(null);
  };

  const handleAgencyModalCancel = () => {
    setAgencyModalOpen(false);
    setEditingAgency(null);
    agencyForm.resetFields();
    setAgencyFormError(null);
  };

  const handleViewAgency = (agency: Agency) => {
    setViewingAgency(agency);
    setViewAgencyModalOpen(true);
  };

  const handleViewAgencyModalClose = () => {
    setViewingAgency(null);
    setViewAgencyModalOpen(false);
  };

  const handleViewCustomer = (customer: Customer) => {
    setViewingCustomer(customer);
    setViewCustomerModalOpen(true);
  };

  const handleViewCustomerModalClose = () => {
    setViewingCustomer(null);
    setViewCustomerModalOpen(false);
  };

  // Table columns
  const customerColumns = [
    { title: 'Store Name', dataIndex: 'store_name', key: 'store_name' },
    { title: 'Referrer', dataIndex: 'referrer', key: 'referrer' },
    { title: 'Owner Mobile', dataIndex: 'owner_mobile', key: 'owner_mobile' },
    { title: 'Accounts Mobile', dataIndex: 'accounts_mobile', key: 'accounts_mobile' },
    { title: 'Days of Payment', dataIndex: 'days_of_payment', key: 'days_of_payment' },
    { title: 'GST Number', dataIndex: 'gst_number', key: 'gst_number' },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: 'Pincode', dataIndex: 'pincode', key: 'pincode' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewCustomer(record)} />
          <Button icon={<EditOutlined />} onClick={() => handleEditCustomer(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteCustomer(record)} />
        </Space>
      ),
    },
  ];

  const agencyColumns = [
    { title: 'Agency Name', dataIndex: 'agency_name', key: 'agency_name' },
    { title: 'Owner Mobile', dataIndex: 'owner_mobile', key: 'owner_mobile' },
    { title: 'Accounts Mobile', dataIndex: 'accounts_mobile', key: 'accounts_mobile' },
    { title: 'Days of Payment', dataIndex: 'days_of_payment', key: 'days_of_payment' },
    { title: 'GST Number', dataIndex: 'gst_number', key: 'gst_number' },
    { title: 'Address', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: 'Pincode', dataIndex: 'pincode', key: 'pincode' },
    { title: 'Region Covered', dataIndex: 'region_covered', key: 'region_covered' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Agency) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleViewAgency(record)} />
          <Button icon={<EditOutlined />} onClick={() => handleEditAgency(record)} />
          <Button icon={<DeleteOutlined />} danger onClick={() => handleDeleteAgency(record)} />
        </Space>
      ),
    },
  ];

  // Tab items for new Ant Design API
  const tabItems = [
    {
      key: 'customers',
      label: 'Customers',
      children: (
        <>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { 
              setEditingCustomer(null); 
              setCustomerModalOpen(true); 
              setCustomerFormError(null);
            }} 
            style={{ marginBottom: 16 }}
          >
            Add Customer
          </Button>
          <Table 
            rowKey="id" 
            columns={customerColumns} 
            dataSource={customers} 
            loading={customerLoading} 
            bordered 
            size="middle" 
            scroll={{ x: 1200 }}
          />
          <Modal
            title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
            open={customerModalOpen}
            destroyOnHidden={true}
            onCancel={handleCustomerModalCancel}
            onOk={() => customerForm.submit()}
            okText={editingCustomer ? 'Update' : 'Create'}
            width={600}
          >
            <Card title={<span><ShopOutlined /> Customer Registration</span>} bordered={false}>
              <Form
                form={customerForm}
                layout="vertical"
                onFinish={handleCustomerSubmit}
                onFinishFailed={(err) => console.error('Form validation failed:', err)}
                autoComplete="off"
                initialValues={{ days_of_payment: 0 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="store_name"
                      label={<span><ShopOutlined /> Store Name</span>}
                      rules={[{ required: true, message: 'Please enter Store Name' }]}
                    >
                      <Input placeholder="e.g. Abc Traders" autoFocus />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="referrer"
                      label={<span><TeamOutlined /> Referrer</span>}
                      rules={[{ required: true, message: 'Please select Referrer' }]}
                    >
                      <Select placeholder="Select Referrer">
                        {referrerOptions.map((ref) => (
                          <Select.Option key={ref} value={ref}>{ref}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="owner_mobile"
                      label={<span><PhoneOutlined /> Owner Mobile</span>}
                      rules={[{ required: true, message: 'Please enter Owner Mobile' }, { pattern: /^\d{10}$/, message: 'Mobile must be exactly 10 digits' }]}
                    >
                      <Input maxLength={10} placeholder="9876543210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="accounts_mobile"
                      label={<span><PhoneOutlined /> Accounts Team Mobile</span>}
                      rules={[{ required: true, message: 'Please enter Accounts Team Mobile' }, { pattern: /^\d{10}$/, message: 'Mobile must be exactly 10 digits' }]}
                    >
                      <Input maxLength={10} placeholder="9876543211" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="days_of_payment"
                      label={<span><NumberOutlined /> Days of Payment</span>}
                      rules={[{ required: true, message: 'Please enter Days of Payment' }]}
                    >
                      <Input type="number" min={0} max={365} placeholder="30" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="gst_number"
                      label={<span><BarcodeOutlined /> GST Number</span>}
                      rules={[
                        { required: true, message: 'Please enter GST Number' },
                        { pattern: /^[0-9]{2}[A-Z0-9]{13}$/, message: 'GST must be 2 digits followed by 13 alphanumeric characters' }
                      ]}
                      tooltip="GST must be 15 alphanumeric characters (2 digits + 13 alphanumeric)"
                    >
                      <Input maxLength={15} placeholder="22ABCDE12345678" onChange={e => customerForm.setFieldsValue({ gst_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="pincode"
                      label={<span><EnvironmentOutlined /> Pincode</span>}
                      rules={[{ required: true, message: 'Please enter Pincode' }, { pattern: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' }]}
                    >
                      <Input maxLength={6} placeholder="123456" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="address"
                  label={<span><HomeOutlined /> Address</span>}
                  rules={[{ required: true, message: 'Please enter Address' }]}
                >
                  <Input.TextArea rows={2} placeholder="123, Main Road, City" />
                </Form.Item>
                {customerFormError && <Alert type="error" message={customerFormError} showIcon style={{ marginBottom: 16 }} />}
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={customerLoading} block disabled={customerLoading}>
                    {editingCustomer ? 'Update' : 'Create'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Modal>
          <Modal
            title="View Customer Details"
            open={viewCustomerModalOpen}
            onCancel={handleViewCustomerModalClose}
            footer={null}
            width={500}
          >
            {viewingCustomer && (
              <Card bordered={false}>
                <p><b>Store Name:</b> {viewingCustomer.store_name}</p>
                <p><b>Referrer:</b> {viewingCustomer.referrer}</p>
                <p><b>Owner Mobile:</b> {viewingCustomer.owner_mobile}</p>
                <p><b>Accounts Team Mobile:</b> {viewingCustomer.accounts_mobile}</p>
                <p><b>Days of Payment:</b> {viewingCustomer.days_of_payment}</p>
                <p><b>GST Number:</b> {viewingCustomer.gst_number}</p>
                <p><b>Pincode:</b> {viewingCustomer.pincode}</p>
                <p><b>Address:</b><br />{viewingCustomer.address}</p>
              </Card>
            )}
          </Modal>
        </>
      )
    },
    {
      key: 'agencies',
      label: 'Agencies',
      children: (
        <>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => { 
              setEditingAgency(null); 
              setAgencyModalOpen(true); 
              setAgencyFormError(null);
            }} 
            style={{ marginBottom: 16 }}
          >
            Add Agency
          </Button>
          <Table 
            rowKey="id" 
            columns={agencyColumns} 
            dataSource={agencies} 
            loading={agencyLoading} 
            bordered 
            size="middle" 
            scroll={{ x: 1200 }}
          />
          <Modal
            title={editingAgency ? 'Edit Agency' : 'Add Agency'}
            open={agencyModalOpen}
            destroyOnHidden={true}
            onCancel={handleAgencyModalCancel}
            onOk={() => agencyForm.submit()}
            okText={editingAgency ? 'Update' : 'Create'}
            width={600}
          >
            <Card title={<span><TeamOutlined /> Agency Registration</span>} bordered={false}>
              <Form
                form={agencyForm}
                layout="vertical"
                onFinish={handleAgencySubmit}
                onFinishFailed={(err) => console.error('Form validation failed:', err)}
                autoComplete="off"
                initialValues={{ days_of_payment: 0 }}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="agency_name"
                      label={<span><TeamOutlined /> Agency Name</span>}
                      rules={[{ required: true, message: 'Please enter Agency Name' }]}
                    >
                      <Input placeholder="e.g. ABC Agency" autoFocus />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="region_covered"
                      label={<span><EnvironmentOutlined /> Region Covered</span>}
                      rules={[{ required: true, message: 'Please enter Region Covered' }]}
                    >
                      <Input placeholder="e.g. North India" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="owner_mobile"
                      label={<span><PhoneOutlined /> Owner Mobile</span>}
                      rules={[{ required: true, message: 'Please enter Owner Mobile' }, { pattern: /^\d{10}$/, message: 'Mobile must be exactly 10 digits' }]}
                    >
                      <Input maxLength={10} placeholder="9876543210" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="accounts_mobile"
                      label={<span><PhoneOutlined /> Accounts Team Mobile</span>}
                      rules={[{ required: true, message: 'Please enter Accounts Team Mobile' }, { pattern: /^\d{10}$/, message: 'Mobile must be exactly 10 digits' }]}
                    >
                      <Input maxLength={10} placeholder="9876543211" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="days_of_payment"
                      label={<span><NumberOutlined /> Days of Payment</span>}
                      rules={[{ required: true, message: 'Please enter Days of Payment' }]}
                    >
                      <Input type="number" min={0} max={365} placeholder="30" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="gst_number"
                      label={<span><BarcodeOutlined /> GST Number</span>}
                      rules={[
                        { required: true, message: 'Please enter GST Number' },
                        { pattern: /^[0-9]{2}[A-Z0-9]{13}$/, message: 'GST must be 2 digits followed by 13 alphanumeric characters' }
                      ]}
                      tooltip="GST must be 15 alphanumeric characters (2 digits + 13 alphanumeric)"
                    >
                      <Input maxLength={15} placeholder="22ABCDE12345678" onChange={e => agencyForm.setFieldsValue({ gst_number: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="pincode"
                      label={<span><EnvironmentOutlined /> Pincode</span>}
                      rules={[{ required: true, message: 'Please enter Pincode' }, { pattern: /^\d{6}$/, message: 'Pincode must be exactly 6 digits' }]}
                    >
                      <Input maxLength={6} placeholder="123456" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="address"
                  label={<span><HomeOutlined /> Address</span>}
                  rules={[{ required: true, message: 'Please enter Address' }]}
                >
                  <Input.TextArea rows={2} placeholder="123, Main Road, City" />
                </Form.Item>
                {agencyFormError && <Alert type="error" message={agencyFormError} showIcon style={{ marginBottom: 16 }} />}
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={agencyLoading} block disabled={agencyLoading}>
                    {editingAgency ? 'Update' : 'Create'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Modal>
          <Modal
            title="View Agency Details"
            open={viewAgencyModalOpen}
            onCancel={handleViewAgencyModalClose}
            footer={null}
            width={500}
          >
            {viewingAgency && (
              <Card bordered={false}>
                <p><b>Agency Name:</b> {viewingAgency.agency_name}</p>
                <p><b>Owner Mobile:</b> {viewingAgency.owner_mobile}</p>
                <p><b>Accounts Team Mobile:</b> {viewingAgency.accounts_mobile}</p>
                <p><b>Days of Payment:</b> {viewingAgency.days_of_payment}</p>
                <p><b>GST Number:</b> {viewingAgency.gst_number}</p>
                <p><b>Pincode:</b> {viewingAgency.pincode}</p>
                <p><b>Address:</b><br />{viewingAgency.address}</p>
                <p><b>Region Covered:</b> {viewingAgency.region_covered}</p>
                {viewingAgency.region_covered && <RegionMap region={viewingAgency.region_covered} />}
              </Card>
            )}
          </Modal>
        </>
      )
    }
  ];

  return (
    <div>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
};

export default Registration; 