import React, { useState } from 'react';
import { Table, Button, Popconfirm, Form, Input, Select, DatePicker, InputNumber, Space, Collapse, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { InwardLog } from '../../types';
import { useInwardLogs } from '../../hooks/useInwardLogs';
import { parseExcelData, ParsedExcelRow } from '../../utils';
import { saveAs } from 'file-saver';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text' | 'date' | 'select';
  record: InwardLog;
  index: number;
  children: React.ReactNode;
  options?: string[];
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  options = [],
  ...restProps
}) => {
  const getInputNode = () => {
    if (inputType === 'number') return <InputNumber />;
    if (inputType === 'date') return <DatePicker format="YYYY-MM-DD" />;
    if (inputType === 'select') {
      return (
        <Select>
          {Array.isArray(options) ? options.map(opt => <Option key={opt} value={opt}>{opt}</Option>) : null}
        </Select>
      );
    }
    return <Input />;
  };

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: dataIndex !== 'stakeholder_name', message: `Please Input ${title}!` }]}
        >
          {getInputNode()}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

interface ColorCodePair {
  color: string;
  colour_code: number;
}

interface InwardLogTableProps {
    productId: number;
    onDataChange: () => void;
    availableColors: string[];
    availableSizes: string[];
    colorCodePairs: ColorCodePair[];
    isReadOnly: boolean;
}

// Helper to convert logs to CSV
function logsToCsv(logs: InwardLog[], availableSizes: string[]): string {
  const headers = [
    'Date',
    'Colour Code',
    'Color',
    ...availableSizes,
    'Category',
    'Stakeholder',
    'Operation',
  ];
  const rows = logs.map(log => [
    log.date || '',
    log.colour_code || '',
    log.color || '',
    ...availableSizes.map(size => (log.sizes && log.sizes[size]) || 0),
    log.category || '',
    log.stakeholder_name || '',
    log.operation || '',
  ]);
  return [headers, ...rows].map(r => r.join(',')).join('\n');
}

const InwardLogTable: React.FC<InwardLogTableProps> = ({ 
    productId, 
    onDataChange, 
    availableColors, 
    availableSizes,
    colorCodePairs,
    isReadOnly
}) => {
    if (typeof productId !== 'number' || isNaN(productId)) return null;
    const { logs, loading, createLog, createLogsBulk, deleteLogsBulk, updateLog, deleteLog, fetchLogs } = useInwardLogs(productId);
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

    const isEditing = (record: InwardLog) => record.id === editingKey;

    const edit = (record: Partial<InwardLog> & { id: React.Key }) => {
        form.setFieldsValue({ ...record, date: record.date ? dayjs(record.date, 'YYYY-MM-DD') : null });
        setEditingKey(record.id);
    };

    const cancel = () => {
        if(isAdding) setIsAdding(false);
        setEditingKey('');
    };

    const save = async (key: React.Key, row?: InwardLog) => {
        try {
            const values = row ? row : await form.validateFields();
            // Remove any size_X fields from values
            const cleanedValues = { ...values };
            Object.keys(cleanedValues).forEach(k => {
                if (k.startsWith('size_')) delete cleanedValues[k];
            });
            const newRow = {
                ...cleanedValues,
                date: dayjs(values.date).format('YYYY-MM-DD'),
                product_id: productId,
                operation: 'Inward',
            };
            
            if (key === 'new_row') {
                await createLog(newRow);
                setIsAdding(false);
            } else {
                await updateLog(key as number, newRow);
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
        form.setFieldsValue({ date: dayjs() });
    };

    // Bulk paste functions
    const handleBulkPasteLoad = () => {
        if (!excelText.trim()) {
            message.error('Please paste Excel data first');
            return;
        }

        const result = parseExcelData(excelText, availableSizes, true);
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
            // Convert parsed rows to InwardLog format
            const logsToCreate = parsedRows.map(row => ({
                ...row,
                product_id: productId,
                operation: 'Inward',
            }));

            // Delete existing logs for the same dates and stakeholders
            const uniqueDates = [...new Set(parsedRows.map(row => row.date))];
            const uniqueStakeholders = [...new Set(parsedRows.map(row => row.stakeholder_name).filter(Boolean))];

            for (const date of uniqueDates) {
                for (const stakeholder of uniqueStakeholders) {
                    if (stakeholder) {
                        await deleteLogsBulk(date, stakeholder);
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
            
            message.success('Successfully saved inward logs');
        } catch (error) {
            message.error('Failed to save logs');
        }
    };

    // Dynamically add a column for each size
    const sizeColumns = Array.isArray(availableSizes)
        ? availableSizes.map(size => ({
            title: size,
            dataIndex: ['sizes', size],
            editable: true,
            render: (_: any, record: InwardLog) => (record.sizes && record.sizes[size]) || 0,
            sorter: (a: InwardLog, b: InwardLog) => ((a.sizes && a.sizes[size]) || 0) - ((b.sizes && b.sizes[size]) || 0),
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
            sorter: (a: InwardLog, b: InwardLog) => new Date(a.date || '1970-01-01').getTime() - new Date(b.date || '1970-01-01').getTime(),
        },
        {
            title: 'Colour Code',
            dataIndex: 'colour_code',
            editable: true,
            inputType: 'number' as const,
            render: (code: number) => code !== undefined ? code : '',
            sorter: (a: InwardLog, b: InwardLog) => (a.colour_code || 0) - (b.colour_code || 0),
        },
        {
            title: 'Color',
            dataIndex: 'color',
            editable: true,
            inputType: 'select' as const,
            options: availableColors,
            sorter: (a: InwardLog, b: InwardLog) => (a.color || '').localeCompare(b.color || ''),
        },
        {
            title: 'Category',
            dataIndex: 'category',
            editable: true,
            inputType: 'select' as const,
            options: ['Supply', 'Return'],
            sorter: (a: InwardLog, b: InwardLog) => (a.category || '').localeCompare(b.category || ''),
        },
        {
            title: 'Stakeholder',
            dataIndex: 'stakeholder_name',
            editable: true,
            inputType: 'text' as const,
            sorter: (a: InwardLog, b: InwardLog) => (a.stakeholder_name || '').localeCompare(b.stakeholder_name || ''),
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            sorter: (a: InwardLog, b: InwardLog) => (a.operation || '').localeCompare(b.operation || ''),
            render: (_: any, record: InwardLog) => {
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
        staticColumns[3], // Category
        staticColumns[4], // Stakeholder
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
            onCell: (record: InwardLog) => {
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
          const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.colour_code === codeValue) : undefined;
          colorOptions = Array.isArray(colorOptions) ? colorOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.color : false })) : [];
        }
        if (colorValue) {
          const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.color === colorValue) : undefined;
          codeOptions = Array.isArray(codeOptions) ? codeOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.colour_code : false })) : [];
        }

        // Handlers to sync fields
        const handleColorChange = (color: string) => {
            const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.color === color) : undefined;
            if (found) {
                form.setFieldsValue({ colour_code: found.colour_code });
            } else {
                form.setFieldsValue({ colour_code: undefined });
            }
        };
        const handleCodeChange = (code: number) => {
            const found = Array.isArray(colorCodePairs) ? colorCodePairs.find(pair => pair.colour_code === code) : undefined;
            if (found) {
                form.setFieldsValue({ color: found.color });
            } else {
                form.setFieldsValue({ color: undefined });
            }
        };

        return (
            <Form form={form} layout="inline" style={{ marginBottom: 16 }} onFinish={() => {
                const values = form.getFieldsValue();
                const sizes: Record<string, number> = {};
                availableSizes.forEach(size => {
                    const val = values[`size_${size}`];
                    if (val !== undefined && val !== null && val !== '') sizes[size] = Number(val);
                });
                // Remove any size_X fields from values
                const cleanedValues = { ...values };
                Object.keys(cleanedValues).forEach(k => {
                    if (k.startsWith('size_')) delete cleanedValues[k];
                });
                const newRow = {
                    ...cleanedValues,
                    sizes,
                    date: dayjs(values.date).format('YYYY-MM-DD'),
                    product_id: productId,
                    operation: 'Inward',
                };
                save('new_row', newRow);
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
                    <Form.Item key={size} name={`size_${size}`} label={size} style={{marginBottom:0}}>
                        <InputNumber placeholder={size} min={0} />
                    </Form.Item>
                ))}
                <Form.Item name="category" initialValue="Supply" rules={[{ required: true }]}> 
                    <Select style={{width: 120}}>
                        <Option value="Supply">Supply</Option>
                        <Option value="Return">Return</Option>
                    </Select>
                </Form.Item>
                <Form.Item name="stakeholder_name"><Input placeholder="Stakeholder"/></Form.Item>
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
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Stakeholder', dataIndex: 'stakeholder_name', key: 'stakeholder_name' },
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

    const handleDownload = () => {
        const csv = logsToCsv(logs, availableSizes);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `inward-log-${dayjs().format('YYYYMMDD')}.csv`);
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
                                onClick={() => setOverwriteModalVisible(true)}
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
                            const { dateRange, stakeholder, date, stakeholder_name } = values;
                            const filterParams: Record<string, any> = {};
                            
                            if (date && stakeholder_name) {
                                filterParams.date = dayjs(date).format('YYYY-MM-DD');
                                filterParams.stakeholder_name = stakeholder_name;
                            } else {
                                if (dateRange && dateRange.length === 2) {
                                    filterParams.start_date = dateRange[0].format('YYYY-MM-DD');
                                    filterParams.end_date = dateRange[1].format('YYYY-MM-DD');
                                }
                                if (stakeholder) filterParams.stakeholder = stakeholder;
                            }
                            setLastFilterParams(filterParams);
                            fetchLogs(filterParams);
                        }}
                        style={{ marginBottom: 8 }}
                    >
                        <Form.Item name="dateRange" label="Date Range">
                            <DatePicker.RangePicker format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item name="stakeholder" label="Stakeholder">
                            <Input placeholder="Stakeholder" allowClear style={{ width: 180 }} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">Apply</Button>
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={handleDownload} type="default">Download</Button>
                        </Form.Item>
                        <Form.Item>
                            <Button danger type="default" onClick={() => setBulkDeleteModalVisible(true)} disabled={logs.length === 0}>Bulk Delete</Button>
                        </Form.Item>
                    </Form>
                </Collapse.Panel>
            </Collapse>
            
            {!isAdding && !isReadOnly ? (
                <Button onClick={handleAddClick} type="primary" style={{ marginBottom: 16 }}>Add a row</Button>
            ) : null}
            {isAdding && !isReadOnly && renderNewRowForm()}
            <Table
                components={{ body: { cell: EditableCell } }}
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
                    You are about to replace all existing entries for this product in the Inward log with the rows you just loaded. 
                    This action cannot be undone. Proceed?
                </p>
            </Modal>

            {/* Bulk Delete Confirmation Modal */}
            <Modal
                title="Confirm Bulk Delete"
                open={bulkDeleteModalVisible}
                onOk={async () => {
                    try {
                        await deleteLogsBulk(lastFilterParams.date, lastFilterParams.stakeholder_name || lastFilterParams.stakeholder);
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
        </Form>
    );
};

export default InwardLogTable; 