import React, { useState, useRef } from 'react';
import { Table, Button, Popconfirm, Form, Input, Select, DatePicker, InputNumber, Space, Collapse, Modal, message, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { Order, ColorCodePair } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { parseExcelData, ParsedExcelRow } from '../../utils';
import { EditOutlined, DeleteOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { TextArea } = Input;

interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text' | 'date' | 'select';
  record: Order;
  index: number;
  children: React.ReactNode;
  options?: string[];
}

interface OrdersLogTableProps {
    productId: number;
    onDataChange: () => void;
    availableColors: string[];
    availableSizes: string[];
    colorCodePairs: ColorCodePair[];
    isReadOnly: boolean;
    allowedAgencies?: string[];
    allowedStores?: string[];
}

const getColorAndCodeOptions = (colorCodePairs: ColorCodePair[], colorValue?: string, codeValue?: number) => {
  let colorOptions = Array.isArray(colorCodePairs) ? colorCodePairs.map(pair => ({ label: pair.color, value: pair.color, disabled: false })) : [];
  let codeOptions = Array.isArray(colorCodePairs) ? colorCodePairs.map(pair => ({ label: pair.colour_code, value: pair.colour_code, disabled: false })) : [];
  if (codeValue) {
    const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.colour_code === codeValue) : undefined;
    colorOptions = Array.isArray(colorOptions) ? colorOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.color : false })) : [];
  }
  if (colorValue) {
    const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.color === colorValue) : undefined;
    codeOptions = Array.isArray(codeOptions) ? codeOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.colour_code : false })) : [];
  }
  return { colorOptions, codeOptions };
};

const EditableCell: React.FC<EditableCellProps & { colorCodePairs: ColorCodePair[]; form: any; allowedAgencies?: string[]; allowedStores?: string[] }> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  options = [],
  colorCodePairs,
  form,
  allowedAgencies,
  allowedStores,
  ...restProps
}) => {
  const colorValue = form ? form.getFieldValue('color') : undefined;
  const codeValue = form ? form.getFieldValue('colour_code') : undefined;
  const { colorOptions, codeOptions } = getColorAndCodeOptions(colorCodePairs, colorValue, codeValue);

  const handleColorChange = (color: string) => {
    const found = colorCodePairs.find(pair => pair.color === color);
    if (found) {
      form.setFieldsValue({ colour_code: found.colour_code });
    } else {
      form.setFieldsValue({ colour_code: undefined });
    }
  };
  const handleCodeChange = (code: number) => {
    const found = colorCodePairs.find(pair => pair.colour_code === code);
    if (found) {
      form.setFieldsValue({ color: found.color });
    } else {
      form.setFieldsValue({ color: undefined });
    }
  };

  const getInputNode = () => {
    if (inputType === 'number') return <InputNumber />;
    if (inputType === 'date') return <DatePicker format="YYYY-MM-DD" />;
    if (inputType === 'select') {
      if (dataIndex === 'color') {
        return (
          <Select
            options={colorOptions}
            onChange={handleColorChange}
            value={colorValue}
            style={{ width: 120 }}
            placeholder="Color"
          />
        );
      }
      if (dataIndex === 'colour_code') {
        return (
          <Select
            options={codeOptions}
            onChange={handleCodeChange}
            value={codeValue}
            style={{ width: 120 }}
            placeholder="Colour Code"
          />
        );
      }
      if (dataIndex === 'agency_name' && Array.isArray(allowedAgencies)) {
        return <Select 
          options={allowedAgencies.map(a => ({ label: a, value: a }))} 
          placeholder="Agency"
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          allowClear
        />;
      }
      if (dataIndex === 'store_name' && Array.isArray(allowedStores)) {
        return <Select 
          options={allowedStores.map(s => ({ label: s, value: s }))} 
          placeholder="Store"
          showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          allowClear
          notFoundContent={null}
        />;
      }
      return <Select options={Array.isArray(options) ? options.map(opt => ({ label: opt, value: opt })) : []} />;
    }
    return <Input />;
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: !['agency_name', 'store_name'].includes(dataIndex), message: `Please Input ${title}!` }]}
        >
          {getInputNode()}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const OrdersLogTable: React.FC<OrdersLogTableProps> = ({ 
    productId, 
    onDataChange, 
    availableColors, 
    availableSizes,
    colorCodePairs,
    isReadOnly,
    allowedAgencies,
    allowedStores
}) => {
    if (typeof productId !== 'number' || isNaN(productId)) return null;
    const { logs, loading, createLog, createLogsBulk, deleteLogsBulk, updateLog, deleteLog, fetchLogs } = useOrders(productId);
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState<React.Key>('');
    const [isAdding, setIsAdding] = useState(false);
    const [filterForm] = Form.useForm();
    
    // New state for bulk operations
    const [excelText, setExcelText] = useState('');
    const [parsedRows, setParsedRows] = useState<ParsedExcelRow[]>([]);
    const [showParsedRows, setShowParsedRows] = useState(false);
    const [overwriteModalVisible, setOverwriteModalVisible] = useState(false);
    const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
    const [lastFilterParams, setLastFilterParams] = useState<Record<string, any>>({});
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [downloadModalVisible, setDownloadModalVisible] = useState(false);
    const [headerFields, setHeaderFields] = useState({
        partyName: '',
        destination: '',
        style: '',
        code: '',
        date: dayjs().format('YYYY-MM-DD'),
    });
    const { token } = useAuth();
    console.log("JWT token used for Excel export:", token);

    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = () => {
        if (!printRef.current) return;
        const printContents = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=800,width=1200');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Print Preview</title>');
            printWindow.document.write('<style>body{margin:0;font-family:inherit;}table{width:100%;border-collapse:collapse;}td,th{border:1px solid #222;padding:4px;text-align:center;}img{max-width:100px;max-height:100px;}</style>');
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

    const isEditing = (record: Order) => record.id === editingKey;

    const edit = (record: Partial<Order> & { id: React.Key }) => {
        form.setFieldsValue({ ...record, date: record.date ? dayjs(record.date, 'YYYY-MM-DD') : null });
        setEditingKey(record.id);
    };

    const cancel = () => {
        if(isAdding) setIsAdding(false);
        setEditingKey('');
    };

    const save = async (key: React.Key, row?: Partial<Order>) => {
        try {
            if (key === 'new_row') {
                // row already contains sizes
                const newRow = {
                    ...row,
                    date: row?.date ? dayjs(row.date).format('YYYY-MM-DD') : undefined,
                    sizes: row?.sizes ? Object.fromEntries(Object.entries(row.sizes).map(([k, v]) => [k, Number(v)])) : undefined,
                };
                await createLog(newRow as any);
                setIsAdding(false);
            } else {
                const values = await form.validateFields();
                const payload = {
                    ...values,
                    sizes: values.sizes ? Object.fromEntries(Object.entries(values.sizes).map(([k, v]) => [k, Number(v)])) : undefined,
                    date: values.date ? dayjs(values.date).format('YYYY-MM-DD') : undefined,
                    product_id: productId,
                    operation: 'Order'
                };
                await updateLog(key as number, payload);
            }
            setEditingKey('');
            onDataChange();
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };
    
    const handleAddClick = () => {
        setIsAdding(true);
        form.resetFields();
    };

    // Bulk paste functions
    const handleBulkPasteLoad = () => {
        if (!excelText.trim()) {
            message.error('Please paste Excel data first');
            return;
        }

        const result = parseExcelData(excelText, availableSizes, false);
        if (!result.success) {
            message.error(result.error || 'Failed to parse Excel data');
            return;
        }

        // Color/Colour Code validation
        const invalidRows: string[] = [];
        (result.data || []).forEach((row, idx) => {
            const found = colorCodePairs.some(
                pair => pair.color === row.color && pair.colour_code === row.colour_code
            );
            if (!found) {
                invalidRows.push(
                    `Row ${idx + 1}: Color "${row.color}" with Colour Code "${row.colour_code}" does not match any defined color-code pair.`
                );
            }
        });
        if (invalidRows.length > 0) {
            message.warning(
                <div>
                    <b>Color/Code mismatch:</b>
                    <ul style={{margin:0, paddingLeft:20}}>
                        {invalidRows.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                </div>,
                8
            );
            return;
        }

        setParsedRows(result.data || []);
        setShowParsedRows(true);
        message.success(`Successfully parsed ${result.data?.length} rows`);
    };

    const handleOverwrite = async () => {
        if (parsedRows.length === 0) {
            message.error('No parsed rows to save');
            return;
        }

        try {
            // Convert parsed rows to Order format
            const logsToCreate = parsedRows.map(row => ({
                ...row,
                product_id: productId,
                operation: 'Order',
                date: row.date ? dayjs(row.date).format('YYYY-MM-DD') : undefined,
                sizes: row.sizes ? Object.fromEntries(Object.entries(row.sizes).map(([k, v]) => [k, Number(v)])) : undefined,
            }));

            // Delete existing logs for the same dates and stores
            const uniqueDates = [...new Set(parsedRows.map(row => row.date))];
            const uniqueStores = [...new Set(parsedRows.map(row => row.store_name).filter(Boolean))];

            for (const date of uniqueDates) {
                for (const store of uniqueStores) {
                    if (store) {
                        await deleteLogsBulk(date, store);
                    }
                }
            }

            // Create new logs
            await createLogsBulk(logsToCreate);

            // Reset state
            setExcelText('');
            setParsedRows([]);
            setShowParsedRows(false);
            setOverwriteModalVisible(false);
            
            message.success('Successfully saved orders');
        } catch (error) {
            message.error('Failed to save logs');
        }
    };

    // Dynamically add a column for each size
    const sizeColumns = Array.isArray(availableSizes)
        ? availableSizes.map(size => ({
            title: size,
            dataIndex: ['sizes', size], // Use nested dataIndex for consistency
            editable: true,
            render: (_: any, record: Order) => (record.sizes && record.sizes[size]) || 0,
            sorter: (a: Order, b: Order) => ((a.sizes && a.sizes[size]) || 0) - ((b.sizes && b.sizes[size]) || 0),
        }))
        : [];

    // Only the static columns have inputType/options
    const staticColumns = [
        {
            title: 'Date',
            dataIndex: 'date',
            editable: true,
            inputType: 'date' as const,
            render: (text: string) => dayjs(text).format('YYYY-MM-DD'),
            sorter: (a: Order, b: Order) => new Date(a.date || '1970-01-01').getTime() - new Date(b.date || '1970-01-01').getTime(),
        },
        {
            title: 'Colour Code',
            dataIndex: 'colour_code',
            editable: true,
            inputType: 'number' as const,
            render: (code: number) => code !== undefined ? code : '',
            sorter: (a: Order, b: Order) => (a.colour_code || 0) - (b.colour_code || 0),
        },
        {
            title: 'Color',
            dataIndex: 'color',
            editable: true,
            inputType: 'select' as const,
            options: availableColors,
            sorter: (a: Order, b: Order) => (a.color || '').localeCompare(b.color || ''),
        },
        {
            title: 'Agency',
            dataIndex: 'agency_name',
            editable: true,
            inputType: 'select' as const,
            options: allowedAgencies,
            sorter: (a: Order, b: Order) => (a.agency_name || '').localeCompare(b.agency_name || ''),
        },
        {
            title: 'Store',
            dataIndex: 'store_name',
            editable: true,
            inputType: 'select' as const,
            options: allowedStores,
            sorter: (a: Order, b: Order) => (a.store_name || '').localeCompare(b.store_name || ''),
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            sorter: (a: Order, b: Order) => (a.operation || '').localeCompare(b.operation || ''),
            render: (_: any, record: Order) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                        <Button type="link" onClick={() => save(record.id)} style={{ marginRight: 8 }}>Save</Button>
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}><Button type="link">Cancel</Button></Popconfirm>
                    </span>
                ) : (
                    <Space>
                        <Button type="link" icon={<EditOutlined />} disabled={editingKey !== ''} onClick={() => edit(record)} />
                        <Popconfirm title="Sure to delete?" onConfirm={() => deleteLog(record.id).then(onDataChange)}>
                            <Button type="link" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    let columns = [
        staticColumns[0], // Date
        staticColumns[1], // Colour Code
        staticColumns[2], // Color
        ...sizeColumns,
        staticColumns[3], // Agency
        staticColumns[4], // Store
        staticColumns[5], // Operation
    ];

    if (isReadOnly) {
        columns = columns.filter(col => col.dataIndex !== 'operation');
    }

    const mergedColumns = Array.isArray(columns) ? columns.map(col => {
        if (!col.editable) {
            return col;
        }
        // Only pass inputType/options if they exist on the column
        return {
            ...col,
            onCell: (record: Order) => {
                const base = {
                    record,
                    dataIndex: col.dataIndex,
                    title: col.title,
                    editing: isEditing(record),
                };
                // Type guard for inputType
                if (typeof (col as any).inputType !== 'undefined') {
                    // @ts-ignore
                    base.inputType = (col as any).inputType;
                }
                // Type guard for options
                if (typeof (col as any).options !== 'undefined') {
                    // @ts-ignore
                    base.options = (col as any).options;
                }
                return base;
            },
        };
    }) : [];
    
    const renderNewRowForm = () => {
        // Get current form values
        const colorValue = form ? form.getFieldValue('color') : undefined;
        const codeValue = form ? form.getFieldValue('colour_code') : undefined;

        // Build options for color and code
        let colorOptions = Array.isArray(colorCodePairs) ? colorCodePairs.map(pair => ({ label: pair.color, value: pair.color, disabled: false })) : [];
        let codeOptions = Array.isArray(colorCodePairs) ? colorCodePairs.map(pair => ({ label: pair.colour_code, value: pair.colour_code, disabled: false })) : [];
        if (codeValue) {
          // If a code is selected, only allow the matching color
          const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.colour_code === codeValue) : undefined;
          colorOptions = Array.isArray(colorOptions) ? colorOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.color : false })) : [];
        }
        if (colorValue) {
          // If a color is selected, only allow the matching code
          const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.color === colorValue) : undefined;
          codeOptions = Array.isArray(codeOptions) ? codeOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.colour_code : false })) : [];
        }

        // Handlers to sync fields
        const handleColorChange = (color: string) => {
            const found = colorCodePairs.find(pair => pair.color === color);
            if (found) {
                form.setFieldsValue({ colour_code: found.colour_code });
            } else {
                form.setFieldsValue({ colour_code: undefined });
            }
        };
        const handleCodeChange = (code: number) => {
            const found = colorCodePairs.find(pair => pair.colour_code === code);
            if (found) {
                form.setFieldsValue({ color: found.color });
            } else {
                form.setFieldsValue({ color: undefined });
            }
        };

        return (
            <Form form={form} layout="inline" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }} onFinish={() => {
                const values = form.getFieldsValue();
                // Build sizes object from availableSizes and values
                const sizes: Record<string, number> = {};
                availableSizes.forEach(size => {
                    const val = values[`size_${size}`];
                    if (val !== undefined && val !== null && val !== '') sizes[size] = Number(val);
                });
                // Remove all size_X fields from cleanedValues
                const cleanedValues: Record<string, any> = { ...values };
                Object.keys(cleanedValues).forEach(k => {
                    if (k.startsWith('size_')) delete cleanedValues[k];
                });
                // Validation: require color, colour_code, and at least one size > 0
                if (!values.color || !values.colour_code) {
                    message.error('Color and Colour Code are required.');
                    return;
                }
                if (Object.keys(sizes).length === 0 || Object.values(sizes).every(qty => qty <= 0)) {
                    message.error('At least one size with quantity > 0 is required.');
                    return;
                }
                const newRow = {
                    ...cleanedValues,
                    sizes,
                    date: dayjs(values.date).format('YYYY-MM-DD'),
                    product_id: productId,
                    operation: 'Order',
                };
                save('new_row', newRow as Partial<Order>);
            }}>
                <Form.Item name="date" rules={[{ required: true }]}><DatePicker format="YYYY-MM-DD"/></Form.Item>
                <Form.Item name="colour_code" rules={[{ required: true }]}> 
                    <Select
                        placeholder="Colour Code"
                        style={{width: 120}}
                        options={codeOptions}
                        onChange={handleCodeChange}
                        value={codeValue}
                    />
                </Form.Item>
                <Form.Item name="color" rules={[{ required: true }]}> 
                    <Select
                        placeholder="Color"
                        style={{width: 120}}
                        options={colorOptions}
                        onChange={handleColorChange}
                        value={colorValue}
                    />
                </Form.Item>
                {availableSizes.map(size => (
                    <Form.Item key={size} name={`size_${size}`} label={size} style={{marginBottom:0, minWidth: 80}}>
                        <InputNumber placeholder={size} min={0} />
                    </Form.Item>
                ))}
                <Form.Item name="agency_name">
                  <Select
                    placeholder="Agency"
                    options={Array.isArray(allowedAgencies) ? allowedAgencies.map(a => ({ label: a, value: a })) : []}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    allowClear
                  />
                </Form.Item>
                <Form.Item name="store_name">
                  <Select
                    placeholder="Store"
                    options={Array.isArray(allowedStores) ? allowedStores.map(s => ({ label: s, value: s })) : []}
                    showSearch
                    filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                    allowClear
                    notFoundContent={null}
                  />
                </Form.Item>
                <Form.Item>
                    <Button htmlType="submit" type="primary">Save</Button>
                    <Button onClick={cancel} style={{marginLeft: 8}}>Cancel</Button>
                </Form.Item>
            </Form>
        );
    };

    // Render parsed rows for preview
    const renderParsedRows = () => {
        if (!showParsedRows || parsedRows.length === 0) return null;

        const previewColumns = [
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Colour Code', dataIndex: 'colour_code', key: 'colour_code' },
            { title: 'Color', dataIndex: 'color', key: 'color' },
            ...availableSizes.map(size => ({
                title: size,
                dataIndex: 'sizes',
                key: size,
                render: (sizes: Record<string, number>) => sizes[size] || 0
            })),
            { title: 'Agency', dataIndex: 'agency_name', key: 'agency_name' },
            { title: 'Store', dataIndex: 'store_name', key: 'store_name' },
        ];

        return (
            <div style={{ marginBottom: 16 }}>
                <h4>Loaded Rows ({parsedRows.length})</h4>
                <Table
                    dataSource={parsedRows}
                    columns={previewColumns}
                    pagination={false}
                    size="small"
                    bordered
                />
            </div>
        );
    };

    const handleBulkDeleteSelected = async () => {
        if (selectedRowKeys.length === 0) return;
        try {
            await Promise.all((selectedRowKeys as number[]).map(id => deleteLog(id)));
            setSelectedRowKeys([]);
            onDataChange();
            message.success(`${selectedRowKeys.length} entries deleted.`);
        } catch {
            message.error('Failed to delete selected entries');
        }
    };

    // Handler for Download button
    const handleDownloadPreview = () => {
        setDownloadModalVisible(true);
    };

    // Handler for Excel download
    const handleExcelDownload = async () => {
        try {
            const response = await fetch('/api/v1/orders/export-excel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    party_name: headerFields.partyName,
                    destination: headerFields.destination,
                    style: headerFields.style,
                    code: headerFields.code,
                    date: headerFields.date,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to download Excel file');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders-log.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setDownloadModalVisible(false);
        } catch (error) {
            message.error('Failed to download Excel file');
        }
    };

    const [bulkActionModalVisible, setBulkActionModalVisible] = useState(false);

    const handleAppend = async () => {
        if (parsedRows.length === 0) {
            message.error('No parsed rows to save');
            return;
        }
        try {
            // Convert parsed rows to Order format
            const logsToCreate = parsedRows.map(row => ({
                ...row,
                product_id: productId,
                operation: 'Order',
                date: row.date ? dayjs(row.date).format('YYYY-MM-DD') : undefined,
                sizes: row.sizes ? Object.fromEntries(Object.entries(row.sizes).map(([k, v]) => [k, Number(v)])) : undefined,
            }));
            await createLogsBulk(logsToCreate);
            setExcelText('');
            setParsedRows([]);
            setShowParsedRows(false);
            message.success('Successfully appended orders');
        } catch (error) {
            message.error('Failed to append logs');
        }
    };

    return (
        <Form form={form} component={false}>
            {/* Bulk Paste Panel */}
            <Collapse style={{ marginBottom: 16 }}>
                <Collapse.Panel header="Bulk Paste from Excel" key="bulk-paste">
                    <div style={{ marginBottom: 16 }}>
                        <TextArea
                            placeholder="Paste your Excel cells here (tab-delimited)"
                            rows={4}
                            value={excelText}
                            onChange={(e) => setExcelText(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />
                        <Space>
                            <Button type="primary" onClick={handleBulkPasteLoad}>
                                Load
                            </Button>
                            <Button 
                                type="default" 
                                onClick={() => setBulkActionModalVisible(true)}
                                disabled={!showParsedRows || parsedRows.length === 0}
                            >
                                Save
                            </Button>
                            <Button onClick={() => {
                                setExcelText('');
                                setParsedRows([]);
                                setShowParsedRows(false);
                            }}>
                                Clear
                            </Button>
                        </Space>
                    </div>
                    {renderParsedRows()}
                </Collapse.Panel>
            </Collapse>

            {/* Filter Panel */}
            <Collapse style={{ marginBottom: 16 }}>
                <Collapse.Panel header="Filter" key="1">
                    <Form
                        form={filterForm}
                        layout="inline"
                        onFinish={(values) => {
                            const { dateRange, agency_name, store_name } = values;
                            const filterParams: Record<string, any> = {};
                            // Regular date range and agency/store filter
                            if (dateRange && dateRange.length === 2) {
                                filterParams.start_date = dateRange[0].format('YYYY-MM-DD');
                                filterParams.end_date = dateRange[1].format('YYYY-MM-DD');
                            }
                            if (agency_name) filterParams.agency_name = agency_name;
                            if (store_name) filterParams.store_name = store_name;
                            setLastFilterParams(filterParams);
                            fetchLogs(filterParams);
                        }}
                        style={{ marginBottom: 8 }}
                    >
                        <Form.Item name="dateRange" label="Date Range">
                            <DatePicker.RangePicker format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item name="agency_name" label="Agency">
                            <Input placeholder="Agency" allowClear style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item name="store_name" label="Store">
                            <Input placeholder="Store" allowClear style={{ width: 120 }} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">Apply</Button>
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={() => { filterForm.resetFields(); fetchLogs({}); }}>Reset</Button>
                        </Form.Item>
                        <Form.Item>
                            <Button danger type="default" onClick={() => setBulkDeleteModalVisible(true)} disabled={logs.length === 0} icon={<DeleteOutlined />} />
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={handleDownloadPreview} type="default">Download</Button>
                        </Form.Item>
                    </Form>
                </Collapse.Panel>
            </Collapse>
            
            {!isAdding && !isReadOnly ? (
                <Button onClick={handleAddClick} type="primary" style={{ marginBottom: 16 }}>Add a row</Button>
            ) : null}
            {isAdding && !isReadOnly && renderNewRowForm()}
            <Table
                components={{ body: { cell: (props: any) => <EditableCell {...props} colorCodePairs={colorCodePairs} form={form} allowedAgencies={allowedAgencies} allowedStores={allowedStores} /> } }}
                bordered
                dataSource={Array.isArray(logs) ? logs : []}
                columns={mergedColumns}
                rowClassName={(_, index) => (index % 2 === 0 ? 'even-row' : 'odd-row')}
                pagination={{ onChange: cancel }}
                loading={loading}
                rowKey="id"
                rowSelection={!isReadOnly ? {
                    selectedRowKeys,
                    onChange: setSelectedRowKeys,
                } : undefined}
            />

            {!isReadOnly && selectedRowKeys.length > 0 && (
                <Popconfirm
                    title={`Are you sure you want to delete ${selectedRowKeys.length} selected entries?`}
                    onConfirm={handleBulkDeleteSelected}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button danger style={{ margin: '16px 0' }} icon={<DeleteOutlined />}>Delete Selected</Button>
                </Popconfirm>
            )}

            {/* Overwrite Confirmation Modal */}
            <Modal
                title="Confirm Save"
                open={overwriteModalVisible}
                onOk={handleOverwrite}
                onCancel={() => setOverwriteModalVisible(false)}
                okText="Save"
                cancelText="Cancel"
            >
                <p>
                    You are about to replace all existing entries for this product in the Orders log with the rows you just loaded. 
                    This action cannot be undone. Proceed?
                </p>
            </Modal>

            {/* Bulk Delete Confirmation Modal */}
            <Modal
                title="Confirm Bulk Delete"
                open={bulkDeleteModalVisible}
                onOk={async () => {
                    try {
                        await deleteLogsBulk(lastFilterParams.start_date, lastFilterParams.store_name);
                        setBulkDeleteModalVisible(false);
                        fetchLogs(lastFilterParams);
                        message.success('Bulk delete successful');
                    } catch (e) {
                        message.error('Bulk delete failed');
                    }
                }}
                onCancel={() => setBulkDeleteModalVisible(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
            >
                <p>Are you sure you want to delete all filtered records? This action cannot be undone.</p>
            </Modal>

            <Modal
                title="Download Preview"
                open={downloadModalVisible}
                onOk={handleExcelDownload}
                onCancel={() => setDownloadModalVisible(false)}
                okText="Download"
                cancelText="Cancel"
                width={1100}
                footer={null}
            >
                <div style={{ marginBottom: 16 }}>
                    <label>Party Name: <Input value={headerFields.partyName} onChange={e => setHeaderFields(f => ({ ...f, partyName: e.target.value }))} style={{ width: 200, marginRight: 8 }} /></label>
                    <label>Destination: <Input value={headerFields.destination} onChange={e => setHeaderFields(f => ({ ...f, destination: e.target.value }))} style={{ width: 200, marginRight: 8 }} /></label>
                    <label>Style: <Input value={headerFields.style} onChange={e => setHeaderFields(f => ({ ...f, style: e.target.value }))} style={{ width: 120, marginRight: 8 }} /></label>
                    <label>Code: <Input value={headerFields.code} onChange={e => setHeaderFields(f => ({ ...f, code: e.target.value }))} style={{ width: 80, marginRight: 8 }} /></label>
                    <label>Date: <Input value={headerFields.date} onChange={e => setHeaderFields(f => ({ ...f, date: e.target.value }))} style={{ width: 120 }} /></label>
                </div>
                <div ref={printRef} style={{ overflowX: 'auto', border: '1px solid #eee', background: '#fff', padding: 0 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontFamily: 'inherit' }}>
                        <tbody>
                            <tr>
                                <td rowSpan={4} style={{ verticalAlign: 'middle', background: '#fff', width: 140, minWidth: 120, border: '1px solid #222', padding: 0 }}>
                                    <img src="/Backstitch-logo.png" alt="Logo" style={{ width: 110, height: 110, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                                </td>
                                <td rowSpan={2} colSpan={2} style={{ border: '1px solid #222', fontWeight: 'bold', fontSize: 16, background: '#fff', textAlign: 'center', verticalAlign: 'bottom' }}>Style</td>
                                <td colSpan={availableSizes.length + 2} style={{ border: '1px solid #222', fontWeight: 'bold', fontSize: 18, background: '#fff', textAlign: 'center' }}>Party Name</td>
                                <td colSpan={3} style={{ border: '1px solid #222', fontWeight: 'bold', fontSize: 18, background: '#fff', textAlign: 'center' }}>Destination</td>
                            </tr>
                            <tr>
                                <td colSpan={availableSizes.length + 2} style={{ border: '1px solid #222', background: '#fff', textAlign: 'center', fontWeight: 'normal', height: 24 }}></td>
                            </tr>
                            <tr>
                                <td rowSpan={2} colSpan={2} style={{ border: '1px solid #222', background: '#fff', textAlign: 'left', fontWeight: 600, fontSize: 15, paddingLeft: 8, verticalAlign: 'top' }}>
                                    {headerFields.style && headerFields.style.split('\n').map((line, idx) => <div key={idx}>{line}</div>)}
                                    {headerFields.code && <div style={{ fontWeight: 'bold' }}>{headerFields.code}</div>}
                                </td>
                                <td colSpan={availableSizes.length + 2} style={{ border: '1px solid #222', background: '#fff', textAlign: 'center', fontWeight: 'normal', height: 24 }}></td>
                                <td colSpan={3} style={{ border: '1px solid #222', background: '#fff', textAlign: 'center', fontWeight: 'normal', height: 24 }}></td>
                            </tr>
                            <tr>
                                <td colSpan={availableSizes.length + 2} style={{ border: '1px solid #222', background: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Transport - With Pass</td>
                                <td colSpan={3} style={{ border: '1px solid #222', background: '#fff', textAlign: 'center', fontWeight: 'bold' }}>Date<br/><span style={{ fontWeight: 600 }}>{headerFields.date}</span></td>
                            </tr>
                            <tr style={{ background: '#e6e6e6', height: 32 }}>
                                <td style={{ fontWeight: 'bold', border: '1px solid #222', background: '#e6e6e6' }}>Color col</td>
                                <td style={{ fontWeight: 'bold', border: '1px solid #222', background: '#e6e6e6' }}>Color</td>
                                {availableSizes.map(size => <td key={size} style={{ fontWeight: 'bold', border: '1px solid #222', background: '#e6e6e6' }}>{size}</td>)}
                                <td style={{ fontWeight: 'bold', border: '1px solid #222', background: '#e6e6e6' }}>Total</td>
                            </tr>
                            {logs.map((log, idx) => (
                                <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff', height: 32 }}>
                                    <td style={{ border: '1px solid #eee' }}>{log.colour_code || ''}</td>
                                    <td style={{ border: '1px solid #eee' }}>{log.color || ''}</td>
                                    {availableSizes.map(size => <td key={size} style={{ border: '1px solid #eee' }}>{(log.sizes && log.sizes[size]) || 0}</td>)}
                                    <td style={{ border: '1px solid #eee' }}>{Object.values(log.sizes || {}).reduce((sum, v) => sum + v, 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                    <Button onClick={() => setDownloadModalVisible(false)} style={{ marginRight: 8 }}>Cancel</Button>
                    <Tooltip title="Print">
                        <Button onClick={handlePrint} style={{ marginRight: 8 }} icon={<PrinterOutlined />} />
                    </Tooltip>
                    <Tooltip title="Download">
                        <Button type="primary" onClick={handleExcelDownload} icon={<DownloadOutlined />} />
                    </Tooltip>
                </div>
            </Modal>

            {/* Bulk Action Modal */}
            <Modal
                title="Bulk Upload Action"
                open={bulkActionModalVisible}
                onCancel={() => setBulkActionModalVisible(false)}
                footer={null}
            >
                <p>Do you want to <b>overwrite</b> existing entries for these dates and stores, or <b>append</b> the new rows to the existing data?</p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Tooltip title="Delete all existing entries for these dates and stores, then upload the new rows.">
                        <Button onClick={async () => {
                            setBulkActionModalVisible(false);
                            await handleOverwrite();
                        }} type="primary" danger>Overwrite</Button>
                    </Tooltip>
                    <Tooltip title="Add the new rows to the existing data. Existing entries will not be deleted.">
                        <Button onClick={async () => {
                            setBulkActionModalVisible(false);
                            await handleAppend();
                        }} type="primary">Append</Button>
                    </Tooltip>
                </div>
            </Modal>
        </Form>
    );
};

export default OrdersLogTable; 