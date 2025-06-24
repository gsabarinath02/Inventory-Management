import React, { useState } from 'react';
import { Table, Button, Popconfirm, Form, Input, Select, DatePicker, InputNumber, Space } from 'antd';
import dayjs from 'dayjs';
import { InwardLog } from '../../types';
import { useInwardLogs } from '../../hooks/useInwardLogs';

const { Option } = Select;

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
          {options.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
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

const InwardLogTable: React.FC<InwardLogTableProps> = ({ 
    productId, 
    onDataChange, 
    availableColors, 
    availableSizes,
    colorCodePairs,
    isReadOnly
}) => {
    const { logs, loading, createLog, updateLog, deleteLog } = useInwardLogs(productId);
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState<React.Key>('');
    const [isAdding, setIsAdding] = useState(false);

    const isEditing = (record: InwardLog) => record.id === editingKey;

    const edit = (record: Partial<InwardLog> & { id: React.Key }) => {
        form.setFieldsValue({ ...record, date: record.date ? dayjs(record.date, 'YYYY-MM-DD') : null });
        setEditingKey(record.id);
    };

    const cancel = () => {
        if(isAdding) setIsAdding(false);
        setEditingKey('');
    };

    const save = async (key: React.Key) => {
        try {
            const row = (await form.validateFields()) as InwardLog;
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
        { title: 'Category', dataIndex: 'category', editable: true, inputType: 'select' as const, options: ['Supply', 'Return'] },
        { title: 'Stakeholder', dataIndex: 'stakeholder_name', editable: true, inputType: 'text' as const },
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_: any, record: InwardLog) => {
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

    const mergedColumns = columns.map(col => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: InwardLog) => ({
                record,
                inputType: col.inputType || 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
                options: col.options,
            }),
        };
    });
    
    const renderNewRowForm = () => {
        // Get current form values
        const colorValue = form.getFieldValue('color');
        const codeValue = form.getFieldValue('colour_code');

        // Build options for color and code
        let colorOptions = colorCodePairs.map(pair => ({ label: pair.color, value: pair.color, disabled: false }));
        let codeOptions = colorCodePairs.map(pair => ({ label: pair.colour_code, value: pair.colour_code, disabled: false }));
        if (codeValue) {
          // If a code is selected, only allow the matching color
          const found = colorCodePairs.find(pair => pair.colour_code === codeValue);
          colorOptions = colorOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.color : false }));
        }
        if (colorValue) {
          // If a color is selected, only allow the matching code
          const found = colorCodePairs.find(pair => pair.color === colorValue);
          codeOptions = codeOptions.map(opt => ({ ...opt, disabled: found ? opt.value !== found.colour_code : false }));
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
                <Form.Item name="size" rules={[{ required: true }]}><Select placeholder="Size" style={{width: 120}} options={availableSizes.map(s => ({label: s, value: s}))} /></Form.Item>
                <Form.Item name="quantity" rules={[{ required: true }]}><InputNumber placeholder="Qty" min={1}/></Form.Item>
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

    return (
        <Form form={form} component={false}>
             {!isAdding && !isReadOnly ? (
                <Button onClick={handleAddClick} type="primary" style={{ marginBottom: 16 }}>Add a row</Button>
            ) : null} 
            {isAdding && !isReadOnly && renderNewRowForm()}
            <Table
                components={{ body: { cell: EditableCell } }}
                bordered
                dataSource={logs}
                columns={mergedColumns}
                rowClassName="editable-row"
                pagination={{ onChange: cancel }}
                loading={loading}
                rowKey="id"
            />
        </Form>
    );
};

export default InwardLogTable; 