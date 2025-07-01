import React, { useState, useRef } from 'react';
import { Table, Button, Modal, Form, InputNumber, message, Tooltip, Card, Divider, Row, Col } from 'antd';
import { Order } from '../../types';
import { usePendingOrders } from '../../hooks/usePendingOrders';
import { InfoCircleOutlined } from '@ant-design/icons';
import { FiTruck } from 'react-icons/fi';
import { pendingOrdersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Input } from 'antd';

export interface PendingOrdersLogTableProps {
    productId: number;
    availableSizes: string[];
}

const PendingOrdersLogTable: React.FC<PendingOrdersLogTableProps> = ({ 
    productId, 
    availableSizes
}) => {
    const [deliverModal, setDeliverModal] = useState<{visible: boolean, order: Order | null}>({visible: false, order: null});
    const [form] = Form.useForm();
    const { logs, loading, fetchLogs } = usePendingOrders(productId);
    const [submitting, setSubmitting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [bulkDeliverModal, setBulkDeliverModal] = useState(false);
    const [bulkForm] = Form.useForm();
    const [bulkInitialValues, setBulkInitialValues] = useState<Record<string, any>>({});
    const [downloadModalVisible, setDownloadModalVisible] = useState(false);
    const [headerFields, setHeaderFields] = useState({ partyName: '', destination: '', style: '', code: '', date: '' });
    const { token } = useAuth();
    const printRef = useRef<HTMLDivElement>(null);

    if (typeof productId !== 'number' || isNaN(productId)) return null;

    // Dynamically add a column for each size
    const sizeColumns = Array.isArray(availableSizes)
        ? availableSizes.map(size => ({
            title: size,
            dataIndex: ['sizes', size],
            render: (_: any, record: Order) => (record.sizes && record.sizes[size]) || 0,
        }))
        : [];

    const handleDeliver = (order: Order) => {
        setDeliverModal({ visible: true, order });
        form.setFieldsValue(order.sizes);
    };

    const handleDeliverConfirm = async () => {
        try {
            const deliveredSizes = form.getFieldsValue();
            setSubmitting(true);
            if (!deliverModal.order || typeof deliverModal.order.id !== 'number') {
                message.error('Order ID missing');
                return;
            }
            await pendingOrdersAPI.deliver(
                deliverModal.order.id,
                deliveredSizes,
                new Date().toISOString().slice(0, 10)
            );
            message.success('Order delivered successfully');
            setDeliverModal({ visible: false, order: null });
            fetchLogs();
            setSelectedRowKeys([]);
        } catch (err) {
            message.error('Failed to deliver order');
        } finally {
            setSubmitting(false);
        }
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    };

    const selectedOrders = logs?.filter((order: Order) => selectedRowKeys.includes(order.id)) || [];

    const handleBulkDeliver = () => {
        // Set initial values for all selected orders/sizes
        const initialValues: Record<string, any> = {};
        selectedOrders.forEach(order => {
            availableSizes.forEach(size => {
                initialValues[`${order.id}_${size}`] = order.sizes?.[size] || 0;
            });
        });
        setBulkInitialValues(initialValues);
        setBulkDeliverModal(true);
    };

    const handleBulkDeliverConfirm = async () => {
        try {
            const values = bulkForm.getFieldsValue();
            setSubmitting(true);
            // Prepare bulk payload: [{orderId, deliveredSizes, date}]
            const payload = selectedOrders.map(order => {
                const deliveredSizes: Record<string, number> = {};
                availableSizes.forEach(size => {
                    const val = values[`${order.id}_${size}`];
                    if (val && val > 0) deliveredSizes[size] = val;
                });
                return {
                    orderId: order.id,
                    deliveredSizes,
                    date: new Date().toISOString().slice(0, 10),
                };
            });
            // Deliver all orders in parallel and wait for all to finish, logging results
            let allSuccess = true;
            await Promise.all(payload.map(async item => {
                if (Object.keys(item.deliveredSizes).length > 0) {
                    try {
                        const res = await pendingOrdersAPI.deliver(item.orderId, item.deliveredSizes, item.date);
                        console.log('Bulk deliver success:', item, res);
                        return res;
                    } catch (err) {
                        allSuccess = false;
                        console.error('Bulk deliver error:', item, err);
                        message.error(`Failed to deliver order #${item.orderId}: ${String(err)}`);
                        return null;
                    }
                }
                return Promise.resolve();
            }));
            if (allSuccess) {
                message.success('Bulk delivery successful');
            }
            setBulkDeliverModal(false);
            setSelectedRowKeys([]);
            fetchLogs();
        } catch (err) {
            message.error('Bulk delivery failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownloadPreview = () => {
        setDownloadModalVisible(true);
    };

    const handleExcelDownload = async () => {
        try {
            const response = await fetch('/api/v1/pending-orders/export-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(headerFields),
            });
            if (!response.ok) {
                throw new Error('Failed to download Excel file');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pending-orders-log.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setDownloadModalVisible(false);
        } catch (error) {
            message.error('Failed to download Excel file');
        }
    };

    const handlePrint = () => {
        if (!printRef.current) return;
        const printContents = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Preview</title>');
            printWindow.document.write('<style>body{margin:0;font-family:Segoe UI,Arial,sans-serif;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #bdbdbd;padding:4px;text-align:center;}img{max-width:100px;max-height:100px;}@media print{button{display:none;}}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContents);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    const columns = [
        { title: 'Date', dataIndex: 'date', render: (text: string) => text, },
        { title: 'Order Number', dataIndex: 'order_number', render: (num: number) => num !== undefined ? num : '', },
        { title: 'Colour Code', dataIndex: 'colour_code', render: (code: number) => code !== undefined ? code : '', },
        { title: 'Color', dataIndex: 'color', render: (color: string) => color || '', },
        ...sizeColumns,
        { title: 'Agency', dataIndex: 'agency_name', render: (agency: string) => agency || '', },
        { title: 'Store', dataIndex: 'store_name', render: (store: string) => store || '', },
        { title: 'Operation', dataIndex: 'operation', render: (op: string) => op || '', },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: Order) => (
                <Tooltip title="Deliver this order">
                    <Button
                        icon={<FiTruck style={{ color: '#1e88e5', fontSize: 22, verticalAlign: 'middle' }} />}
                        onClick={() => handleDeliver(record)}
                        disabled={submitting}
                        style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        Deliver
                    </Button>
                </Tooltip>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Button
                    type="primary"
                    disabled={selectedRowKeys.length === 0}
                    onClick={handleBulkDeliver}
                    style={{ fontWeight: 600 }}
                >
                    Bulk Deliver
                </Button>
                <Button onClick={handleDownloadPreview} type="default">Download</Button>
            </div>
            <Table
                bordered
                dataSource={Array.isArray(logs) ? logs : []}
                columns={columns}
                loading={loading}
                rowKey="id"
                pagination={false}
                rowSelection={rowSelection}
            />
            <Modal
                title={<div style={{fontWeight:600, fontSize:20, letterSpacing:1}}>Deliver Order</div>}
                open={deliverModal.visible}
                onCancel={() => setDeliverModal({ visible: false, order: null })}
                onOk={handleDeliverConfirm}
                confirmLoading={submitting}
                okText={<span style={{fontWeight:600}}>Deliver</span>}
                cancelText="Cancel"
                destroyOnClose
                bodyStyle={{ background: '#f6f8fa', borderRadius: 12, padding: 0, border: '1px solid #e5e7eb' }}
                style={{ top: 60, minWidth: 480 }}
                footer={null}
            >
                <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px #0001', margin: 0, padding: 0 }} bodyStyle={{ padding: 0 }}>
                    {deliverModal.order && (
                        <div style={{ background: '#fff', borderRadius: '12px 12px 0 0', padding: 20, borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                                <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 20, marginRight: 8 }} />
                                <span style={{ fontWeight: 600, fontSize: 16 }}>Order #{deliverModal.order.order_number}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                                <span>Date: <b>{deliverModal.order.date}</b></span> &nbsp;|&nbsp;
                                <span>Color: <b>{deliverModal.order.color}</b></span> &nbsp;|&nbsp;
                                <span>Agency: <b>{deliverModal.order.agency_name}</b></span> &nbsp;|&nbsp;
                                <span>Store: <b>{deliverModal.order.store_name}</b></span>
                            </div>
                        </div>
                    )}
                    <Divider style={{ margin: 0 }} />
                    <div style={{ padding: 24, background: '#f6f8fa', borderRadius: '0 0 12px 12px' }}>
                        <div style={{ marginBottom: 12, fontWeight: 500, fontSize: 15 }}>Enter quantities to deliver for each size:</div>
                        <Form form={form} layout="vertical">
                            <Row gutter={[16, 8]}>
                                {availableSizes.map(size => (
                                    <Col xs={24} sm={12} md={8} lg={8} key={size}>
                                        <Form.Item
                                            name={size}
                                            label={<span style={{ fontWeight: 400 }}>{size}</span>}
                                            initialValue={deliverModal.order?.sizes?.[size] || 0}
                                            rules={[{ type: 'number', min: 0, max: deliverModal.order?.sizes?.[size] || 0 }]}
                                            extra={<span style={{ color: '#888', fontSize: 12 }}>Max: {deliverModal.order?.sizes?.[size] || 0}</span>}
                                        >
                                            <InputNumber min={0} max={deliverModal.order?.sizes?.[size] || 0} style={{ width: '100%' }} />
                                        </Form.Item>
                                    </Col>
                                ))}
                            </Row>
                        </Form>
                        <Divider style={{ margin: '16px 0 8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                            <Button onClick={() => setDeliverModal({ visible: false, order: null })} style={{ minWidth: 90 }}>
                                Cancel
                            </Button>
                            <Button type="primary" style={{ minWidth: 110, fontWeight: 600 }} loading={submitting} onClick={handleDeliverConfirm}>
                                Deliver
                            </Button>
                        </div>
                    </div>
                </Card>
            </Modal>
            <Modal
                title={<div style={{ fontWeight: 600, fontSize: 20 }}>Bulk Deliver Orders</div>}
                open={bulkDeliverModal}
                onCancel={() => setBulkDeliverModal(false)}
                onOk={handleBulkDeliverConfirm}
                confirmLoading={submitting}
                okText={<span style={{ fontWeight: 600 }}>Deliver All</span>}
                cancelText="Cancel"
                destroyOnClose
                bodyStyle={{ background: '#f6f8fa', borderRadius: 12, padding: 0, border: '1px solid #e5e7eb' }}
                style={{ top: 60, minWidth: 600 }}
            >
                <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 2px 12px #0001', margin: 0, padding: 0 }} bodyStyle={{ padding: 0 }}>
                    <div style={{ padding: 24, background: '#f6f8fa', borderRadius: '12px' }}>
                        <div style={{ marginBottom: 12, fontWeight: 500, fontSize: 15 }}>Enter quantities to deliver for each order and size:</div>
                        <Form form={bulkForm} layout="vertical" initialValues={bulkInitialValues}>
                            {selectedOrders.map(order => (
                                <div key={order.id} style={{ marginBottom: 18, background: '#fff', borderRadius: 8, padding: 16, boxShadow: '0 1px 4px #0001' }}>
                                    <div style={{ fontWeight: 500, marginBottom: 6 }}>
                                        Order #{order.order_number} &mdash; {order.color} ({order.date})
                                    </div>
                                    <Row gutter={[16, 8]}>
                                        {availableSizes.map(size => (
                                            <Col xs={24} sm={12} md={8} lg={8} key={size}>
                                                <Form.Item
                                                    name={`${order.id}_${size}`}
                                                    label={<span style={{ fontWeight: 400 }}>{size}</span>}
                                                    rules={[{ type: 'number', min: 0, max: order.sizes?.[size] || 0 }]}
                                                    extra={<span style={{ color: '#888', fontSize: 12 }}>Max: {order.sizes?.[size] || 0}</span>}
                                                >
                                                    <InputNumber min={0} max={order.sizes?.[size] || 0} style={{ width: '100%' }} />
                                                </Form.Item>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}
                        </Form>
                    </div>
                </Card>
            </Modal>
            <Modal
                title={<div style={{fontWeight:600, fontSize:20, letterSpacing:1}}>Download Preview</div>}
                open={downloadModalVisible}
                onOk={handleExcelDownload}
                onCancel={() => setDownloadModalVisible(false)}
                okText="Download"
                cancelText="Cancel"
                width={1200}
                footer={null}
            >
                <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Input addonBefore="Party Name" value={headerFields.partyName} onChange={e => setHeaderFields(f => ({ ...f, partyName: e.target.value }))} style={{ width: 220 }} />
                    <Input addonBefore="Destination" value={headerFields.destination} onChange={e => setHeaderFields(f => ({ ...f, destination: e.target.value }))} style={{ width: 220 }} />
                    <Input addonBefore="Style" value={headerFields.style} onChange={e => setHeaderFields(f => ({ ...f, style: e.target.value }))} style={{ width: 160 }} />
                    <Input addonBefore="Code" value={headerFields.code} onChange={e => setHeaderFields(f => ({ ...f, code: e.target.value }))} style={{ width: 120 }} />
                    <Input addonBefore="Date" value={headerFields.date} onChange={e => setHeaderFields(f => ({ ...f, date: e.target.value }))} style={{ width: 160 }} />
                </div>
                <div ref={printRef} style={{ overflowX: 'auto', border: '1px solid #e0e0e0', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
                        <thead>
                            <tr>
                                <td rowSpan={4} style={{ border: '1px solid #bdbdbd', textAlign: 'center', verticalAlign: 'middle', width: 140, background: '#f8fafc' }}>
                                    <img src="/Backstitch-logo.png" alt="Logo" style={{ width: 100, height: 100, objectFit: 'contain', margin: 8 }} />
                                </td>
                                <td rowSpan={3} style={{ border: '1px solid #bdbdbd', textAlign: 'left', verticalAlign: 'top', fontWeight: 600, fontSize: 15, padding: 8, minWidth: 120, background: '#f8fafc', whiteSpace: 'pre-line' }}>
                                    <div><b>Style</b></div>
                                    <div style={{ marginTop: 4, fontWeight: 400, fontSize: 14 }}>{headerFields.style || ''}</div>
                                    <div style={{ fontWeight: 400, fontSize: 13 }}>{headerFields.code || ''}</div>
                                </td>
                                <td colSpan={8} style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, fontSize: 18, background: '#f8fafc' }}>{headerFields.partyName || 'Party Name'}</td>
                                <td colSpan={4} style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, fontSize: 18, background: '#f8fafc' }}>{headerFields.destination || 'Destination'}</td>
                            </tr>
                            <tr>
                                <td colSpan={12} style={{ border: '1px solid #bdbdbd', height: 24, background: '#f8fafc' }}></td>
                            </tr>
                            <tr>
                                <td colSpan={12} style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, fontSize: 15, background: '#f1f5f9' }}>Transport - With Pass</td>
                            </tr>
                            <tr>
                                <td colSpan={8} style={{ border: '1px solid #bdbdbd', background: '#f8fafc' }}></td>
                                <td colSpan={2} style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, background: '#f8fafc' }}>Date</td>
                                <td colSpan={2} style={{ border: '1px solid #bdbdbd', textAlign: 'center', background: '#f8fafc' }}>{headerFields.date}</td>
                            </tr>
                            <tr style={{ background: '#e3eaf3' }}>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 60 }}>Order ID</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 90 }}>Date</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Colour Code</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 80 }}>Colour</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>S</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>M</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>L</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>XL</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>XXL</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>3XL</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>4XL</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 40 }}>5XL</th>
                                <th style={{ border: '1px solid #bdbdbd', textAlign: 'center', fontWeight: 700, minWidth: 60 }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.isArray(logs) && logs.map((row, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f6f8fa' }}>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.id}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.date}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.colour_code}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.color}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.s || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.m || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.l || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.xl || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.xxl || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.['3xl'] || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.['4xl'] || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center' }}>{row.sizes?.['5xl'] || 0}</td>
                                    <td style={{ border: '1px solid #e0e0e0', textAlign: 'center', fontWeight: 600 }}>{Object.values(row.sizes || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, gap: 8 }}>
                    <Button onClick={() => setDownloadModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
                    <Button onClick={handlePrint} style={{ background: '#f5f5f5', color: '#333', border: '1px solid #bdbdbd' }}>Print</Button>
                    <Button type="primary" onClick={handleExcelDownload}>Download</Button>
                </div>
            </Modal>
        </>
    );
};

export default PendingOrdersLogTable; 