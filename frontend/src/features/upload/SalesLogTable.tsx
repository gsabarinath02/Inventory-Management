import React, { useState } from 'react';
import { Table, Button, Popconfirm, Form, Input, Select, DatePicker, InputNumber, Space, Collapse } from 'antd';
import dayjs from 'dayjs';
import { SalesLog } from '../../types';
import { useSalesLogs } from '../../hooks/useSalesLogs';

interface EditableCellProps {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text' | 'date' | 'select';
  record: SalesLog;
  index: number;
  children: React.ReactNode;
  options?: string[];
}

interface ColorCodePair {
  color: string;
  colour_code: number;
}

interface SalesLogTableProps {
    productId: number;
    onDataChange: () => void;
    availableColors: string[];
    availableSizes: string[];
    colorCodePairs: ColorCodePair[];
    isReadOnly: boolean;
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

const EditableCell: React.FC<EditableCellProps & { colorCodePairs: ColorCodePair[]; form: any }> = ({
  editing,
  dataIndex,
  title,
  inputType,
  children,
  options = [],
  colorCodePairs,
  form,
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

const SalesLogTable: React.FC<SalesLogTableProps> = ({ 
    productId, 
    onDataChange, 
    availableColors, 
    availableSizes,
    colorCodePairs,
    isReadOnly
}) => {
    const { logs, loading, createLog, updateLog, deleteLog, fetchLogs } = useSalesLogs(productId);
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState<React.Key>('');
    const [isAdding, setIsAdding] = useState(false);
    const [filterForm] = Form.useForm();

    const isEditing = (record: SalesLog) => record.id === editingKey;

    const edit = (record: Partial<SalesLog> & { id: React.Key }) => {
        form.setFieldsValue({ ...record, date: record.date ? dayjs(record.date, 'YYYY-MM-DD') : null });
        setEditingKey(record.id);
    };

    const cancel = () => {
        if(isAdding) setIsAdding(false);
        setEditingKey('');
    };

    const save = async (key: React.Key) => {
        try {
            const row = (await form.validateFields()) as SalesLog;
            const newRow = { 
                ...row, 
                date: dayjs(row.date).format('YYYY-MM-DD'),
                product_id: productId 
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
    };

    let columns = [
        { title: 'Date', dataIndex: 'date', editable: true, inputType: 'date' as const, render: (text: string) => dayjs(text).format('YYYY-MM-DD')},
        { title: 'Color', dataIndex: 'color', editable: true, inputType: 'select' as const, options: availableColors },
        { title: 'Colour Code', dataIndex: 'colour_code', editable: true, inputType: 'number' as const, render: (code: number) => code !== undefined ? code : '' },
        { title: 'Size', dataIndex: 'size', editable: true, inputType: 'select' as const, options: availableSizes },
        { title: 'Quantity', dataIndex: 'quantity', editable: true, inputType: 'number' as const },
        { title: 'Agency', dataIndex: 'agency_name', editable: true, inputType: 'text' as const },
        { title: 'Store', dataIndex: 'store_name', editable: true, inputType: 'text' as const },
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_: any, record: SalesLog) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                        <Button type="link" onClick={() => save(record.id)} style={{ marginRight: 8 }}>Save</Button>
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}><Button type="link">Cancel</Button></Popconfirm>
                    </span>
                ) : (
                    <Space>
                        <Button type="link" disabled={editingKey !== ''} onClick={() => edit(record)}>Edit</Button>
                        <Popconfirm title="Sure to delete?" onConfirm={() => deleteLog(record.id).then(onDataChange)}><Button type="link" danger>Delete</Button></Popconfirm>
                    </Space>
                );
            },
        },
    ];

    if (isReadOnly) {
        columns = columns.filter(col => col.dataIndex !== 'operation');
    }

    const mergedColumns = Array.isArray(columns) ? columns.map(col => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: SalesLog) => ({
                record,
                inputType: col.inputType || 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
                options: col.options,
                colorCodePairs,
                form,
            }),
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
            <Form form={form} layout="inline" style={{ marginBottom: 16 }} onFinish={() => save('new_row')}>
                <Form.Item name="date" rules={[{ required: true }]}><DatePicker format="YYYY-MM-DD"/></Form.Item>
                <Form.Item name="color" rules={[{ required: true }]}>
                    <Select
                        placeholder="Color"
                        style={{width: 120}}
                        options={colorOptions}
                        onChange={handleColorChange}
                        value={colorValue}
                    />
                </Form.Item>
                <Form.Item name="colour_code" rules={[{ required: true }]}>
                    <Select
                        placeholder="Colour Code"
                        style={{width: 120}}
                        options={codeOptions}
                        onChange={handleCodeChange}
                        value={codeValue}
                    />
                </Form.Item>
                <Form.Item name="size" label="Size" style={{marginBottom:0}}><Select style={{width: 120}} options={Array.isArray(availableSizes) ? availableSizes.map(s => ({label: s, value: s})) : []} /></Form.Item>
                <Form.Item name="quantity" rules={[{ required: true }]}><InputNumber placeholder="Qty" min={1}/></Form.Item>
                <Form.Item name="agency_name"><Input placeholder="Agency"/></Form.Item>
                <Form.Item name="store_name"><Input placeholder="Store"/></Form.Item>
                <Form.Item>
                    <Button htmlType="submit" type="primary">Save</Button>
                    <Button onClick={cancel} style={{marginLeft: 8}}>Cancel</Button>
                </Form.Item>
            </Form>
        );
    };

    return (
        <>
            <Collapse style={{ marginBottom: 16 }}>
                <Collapse.Panel header="Filter" key="1">
                    <Form
                        form={filterForm}
                        layout="inline"
                        onFinish={(values) => {
                            const { dateRange, stakeholder } = values;
                            const filterParams: Record<string, any> = {};
                            if (dateRange && dateRange.length === 2) {
                                filterParams.start_date = dateRange[0].format('YYYY-MM-DD');
                                filterParams.end_date = dateRange[1].format('YYYY-MM-DD');
                            }
                            if (stakeholder) filterParams.stakeholder = stakeholder;
                            fetchLogs(filterParams);
                        }}
                        style={{ marginBottom: 8 }}
                    >
                        <Form.Item name="dateRange" label="Date Range">
                            <DatePicker.RangePicker format="YYYY-MM-DD" />
                        </Form.Item>
                        <Form.Item name="stakeholder" label="Agency/Store">
                            <Input placeholder="Agency or Store" allowClear style={{ width: 180 }} />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">Apply</Button>
                        </Form.Item>
                        <Form.Item>
                            <Button onClick={() => { filterForm.resetFields(); fetchLogs({}); }}>Reset</Button>
                        </Form.Item>
                    </Form>
                </Collapse.Panel>
            </Collapse>
            <Form form={form} component={false}>
                {!isAdding && !isReadOnly ? (
                    <Button onClick={handleAddClick} type="primary" style={{ marginBottom: 16 }}>Add a row</Button>
                ) : null}
                {isAdding && !isReadOnly && renderNewRowForm()}
                <Table
                    components={{ body: { cell: EditableCell } }}
                    bordered
                    dataSource={Array.isArray(logs) ? logs : []}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={{ onChange: cancel }}
                    loading={loading}
                    rowKey="id"
                />
            </Form>
        </>
    );
};

export default SalesLogTable; 