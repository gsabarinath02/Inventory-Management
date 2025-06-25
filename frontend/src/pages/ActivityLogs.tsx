import React, { useEffect } from 'react';
import {
  Card, Table, Typography, Form, Row, Col, Select, DatePicker, Button, Tag, Space, Collapse, Popconfirm, message
} from 'antd';
import { TablePaginationConfig } from 'antd/lib/table';
import { AuditLog } from '../types';
import { User } from '../types/auth';
import { format } from 'date-fns';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { useUsers } from '../hooks/useUsers';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { Key } from 'react';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const entityList = [
  { value: 'Product', label: 'Product' },
  { value: 'InwardLog', label: 'Inward Log' },
  { value: 'SalesLog', label: 'Sales Log' },
];

// Helper to parse enums and Python object strings to readable text
const parseValue = (val: any) => {
  if (typeof val === 'string') {
    // Remove Python enum formatting
    const match = val.match(/<.*?\.(.*?): '(.*?)'>/);
    if (match) return match[2];
    // Remove datetime.date(YYYY, M, D)
    const dateMatch = val.match(/datetime\.date\((\d+), (\d+), (\d+)\)/);
    if (dateMatch) {
      return `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
    }
    return val;
  }
  return val;
};

const prettyJSON = (obj: any) => {
  try {
    if (typeof obj === 'string') {
      // Try to parse if it's a stringified JSON
      return JSON.stringify(JSON.parse(obj), null, 2);
    }
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

const ActivityLogsPage: React.FC = () => {
  const { logs, loading, pagination, fetchLogs, setPagination, deleteLog, bulkDeleteLogs } = useAuditLogs();
  const { users, loading: usersLoading } = useUsers();
  const [form] = Form.useForm();
  const [selectedRowKeys, setSelectedRowKeys] = React.useState<Key[]>([]);
  const userRole = localStorage.getItem('userRole') || 'admin'; // Replace with real user role logic

  useEffect(() => {
    fetchLogs(form.getFieldsValue(), pagination.current, pagination.pageSize);
    // eslint-disable-next-line
  }, [fetchLogs, pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: TablePaginationConfig, _filters: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current || 1,
      pageSize: newPagination.pageSize || 10
    }));
  };

  const handleFilterSubmit = (values: any) => {
    const filters = {
      ...values,
      start_date: values.date_range ? values.date_range[0].toISOString() : null,
      end_date: values.date_range ? values.date_range[1].toISOString() : null,
    };
    delete filters.date_range;
    fetchLogs(filters, 1, pagination.pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    fetchLogs({}, 1, pagination.pageSize);
  };

  // Enhanced Legend for color coding
  const DiffLegend = () => (
    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: '#e6ffed', border: '1px solid #b7eb8f', borderRadius: 3, marginRight: 4 }}></span>
        <span style={{ color: 'green', fontWeight: 500 }}>Added/Increase</span>
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span style={{ display: 'inline-block', width: 16, height: 16, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 3, marginRight: 4 }}></span>
        <span style={{ color: 'red', fontWeight: 500 }}>Removed/Decrease</span>
      </span>
    </div>
  );

  // Helper to render diff for UPDATE
  const renderUpdateDiff = (field: string, oldValue: any, newValue: any) => {
    const oldNum = Number(oldValue);
    const newNum = Number(newValue);
    const valueStyle = {
      fontFamily: 'monospace',
      padding: '2px 6px',
      borderRadius: 4,
      display: 'inline-block',
    };
    if (!isNaN(oldNum) && !isNaN(newNum)) {
      if (newNum > oldNum) {
        return <div style={{ border: '1px solid #b7eb8f', background: '#e6ffed', borderRadius: 6, padding: 8, marginBottom: 2 }}>
          <div><strong>Field:</strong> {field}</div>
          <div><strong>Old:</strong> <span style={{ ...valueStyle, color: 'red', background: '#fff1f0', border: '1px solid #ffa39e', textDecoration: 'line-through' }}>{oldValue}</span></div>
          <div><strong>New:</strong> <span style={{ ...valueStyle, color: 'green', background: '#e6ffed', border: '1px solid #b7eb8f', fontWeight: 700 }}>{newValue}</span></div>
        </div>;
      } else if (newNum < oldNum) {
        return <div style={{ border: '1px solid #ffa39e', background: '#fff1f0', borderRadius: 6, padding: 8, marginBottom: 2 }}>
          <div><strong>Field:</strong> {field}</div>
          <div><strong>Old:</strong> <span style={{ ...valueStyle, color: 'green', background: '#e6ffed', border: '1px solid #b7eb8f', fontWeight: 700 }}>{oldValue}</span></div>
          <div><strong>New:</strong> <span style={{ ...valueStyle, color: 'red', background: '#fff1f0', border: '1px solid #ffa39e', textDecoration: 'line-through' }}>{newValue}</span></div>
        </div>;
      }
    }
    if (oldValue !== newValue) {
      return <div style={{ border: '1px solid #b7eb8f', background: '#e6ffed', borderRadius: 6, padding: 8, marginBottom: 2 }}>
        <div><strong>Field:</strong> {field}</div>
        <div><strong>Old:</strong> <span style={{ ...valueStyle, color: 'red', background: '#fff1f0', border: '1px solid #ffa39e', textDecoration: 'line-through' }}>{String(parseValue(oldValue))}</span></div>
        <div><strong>New:</strong> <span style={{ ...valueStyle, color: 'green', background: '#e6ffed', border: '1px solid #b7eb8f', fontWeight: 700 }}>{String(parseValue(newValue))}</span></div>
      </div>;
    }
    return <div style={{ border: '1px solid #d9d9d9', background: '#fafafa', borderRadius: 6, padding: 8, marginBottom: 2 }}>
      <div><strong>Field:</strong> {field}</div>
      <div><strong>Old:</strong> <span style={valueStyle}>{String(parseValue(oldValue))}</span></div>
      <div><strong>New:</strong> <span style={valueStyle}>{String(parseValue(newValue))}</span></div>
    </div>;
  };

  // Helper to render CREATE/DELETE diffs
  const renderObjectDiff = (obj: any, color: string, prefix: string, icon: React.ReactNode) => {
    if (!obj) return null;
    let parsedObj = obj;
    if (typeof obj === 'string') {
      try {
        parsedObj = JSON.parse(obj);
      } catch {
        parsedObj = obj;
      }
    }
    return (
      <Collapse bordered={false} style={{ background: color === 'green' ? '#e6ffed' : '#fff1f0', borderRadius: 6, marginTop: 4 }}>
        <Panel header={<span style={{ color, fontWeight: 500 }}>{icon} {prefix} Details</span>} key="1" showArrow={true}>
          <pre style={{ fontFamily: 'monospace', fontSize: 13, margin: 0 }}>{prettyJSON(parsedObj)}</pre>
        </Panel>
      </Collapse>
    );
  };

  const columns = [
    {
      title: 'Date/Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      align: 'right' as const,
      sorter: (a: AuditLog, b: AuditLog) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (text: string) => format(new Date(text), 'yyyy-MM-dd HH:mm'),
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      width: 200,
      render: (text: string) => <span style={{ fontWeight: 600 }}>{text}</span>,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        let color = 'geekblue';
        let icon = <EditOutlined />;
        if (action === 'DELETE') { color = 'volcano'; icon = <DeleteOutlined />; }
        if (action === 'CREATE') { color = 'green'; icon = <PlusOutlined />; }
        return <Tag color={color} icon={icon} style={{ fontWeight: 600 }}>{action.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Entity',
      dataIndex: 'entity',
      key: 'entity',
      width: 200,
      render: (entity: string, record: AuditLog) => `${entity} (ID: ${record.entity_id})`,
    },
    {
      title: 'Changes',
      key: 'changes',
      render: (_: any, record: AuditLog) => {
        if (record.action === 'UPDATE') {
          return (
            <Space direction="vertical" size="small">
              {renderUpdateDiff(record.field_changed || '', record.old_value, record.new_value)}
            </Space>
          );
        }
        if (record.action === 'CREATE') {
          return (
            <div>
              <strong>New Data:</strong>
              {renderObjectDiff(record.new_value, 'green', '+', <PlusOutlined />)}
            </div>
          );
        }
        if (record.action === 'DELETE') {
          return (
            <div>
              <strong>Deleted Data:</strong>
              {renderObjectDiff(record.old_value, 'red', '-', <DeleteOutlined />)}
            </div>
          );
        }
        return 'N/A';
      },
    },
  ];

  const handleDelete = async (logId: number) => {
    try {
      await deleteLog(logId, form.getFieldsValue(), pagination.current, pagination.pageSize);
      message.success('Log deleted successfully');
      setSelectedRowKeys(selectedRowKeys.filter(id => id !== logId));
    } catch {
      message.error('Failed to delete log');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteLogs(selectedRowKeys as number[], form.getFieldsValue(), pagination.current, pagination.pageSize);
      message.success(`${selectedRowKeys.length} logs deleted successfully`);
      setSelectedRowKeys([]);
    } catch {
      message.error('Failed to delete selected logs');
    }
  };

  const columnsWithDelete = [
    ...columns,
    userRole === 'admin' ? {
      title: 'Delete',
      key: 'delete',
      width: 80,
      render: (_: any, record: AuditLog) => (
        <Popconfirm
          title="Are you sure you want to delete this log?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    } : null,
  ].filter(Boolean);

  return (
    <Card style={{ margin: 24, boxShadow: '0 2px 8px #f0f1f2' }}>
      <Title level={2}>Activity Logs</Title>
      <Card style={{ marginBottom: 24, background: '#fafcff', border: '1px solid #e6f7ff' }} bodyStyle={{ padding: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleFilterSubmit}>
          <Row gutter={16} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="user_id" label="User">
                <Select
                  placeholder="All Users"
                  allowClear
                  loading={usersLoading}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                >
                  {Array.isArray(users) ? users.map((u: User) => <Option key={u.id} value={u.id} label={u.email}>{u.email}</Option>) : null}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item name="entity" label="Entity">
                <Select placeholder="All Entities" allowClear showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => (option?.label as string).toLowerCase().includes(input.toLowerCase())}
                >
                  {Array.isArray(entityList) ? entityList.map(e => <Option key={e.value} value={e.value} label={e.label}>{e.label}</Option>) : null}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="date_range" label="Date Range">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <Button htmlType="button" onClick={handleReset} style={{ marginRight: 8 }}>Reset</Button>
              <Button type="primary" htmlType="submit">Filter</Button>
            </Col>
          </Row>
        </Form>
      </Card>
      <DiffLegend />
      <Card bordered style={{ boxShadow: '0 1px 4px #f0f1f2' }}>
        <Table
          rowSelection={userRole === 'admin' ? {
            selectedRowKeys,
            onChange: (keys: Key[]) => setSelectedRowKeys(keys),
          } : undefined}
          columns={columnsWithDelete as any}
          dataSource={logs}
          loading={loading}
          pagination={{ ...pagination, showSizeChanger: true }}
          onChange={handleTableChange}
          rowKey="id"
          bordered
          scroll={{ x: 1000 }}
          style={{ background: '#fff' }}
        />
      </Card>
      {userRole === 'admin' && selectedRowKeys.length > 0 && (
        <Popconfirm
          title={`Are you sure you want to delete ${selectedRowKeys.length} selected logs?`}
          onConfirm={handleBulkDelete}
          okText="Yes"
          cancelText="No"
        >
          <Button danger style={{ margin: '16px 0' }} icon={<DeleteOutlined />}>Delete Selected</Button>
        </Popconfirm>
      )}
    </Card>
  );
};

export default ActivityLogsPage; 