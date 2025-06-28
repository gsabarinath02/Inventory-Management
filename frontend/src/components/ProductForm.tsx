import { Form, Input, InputNumber, Select, Alert, Button, Space, Tag } from 'antd';
import { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { ProductFormData, Product } from '../types';
import { VALIDATION_RULES } from '../constants';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { getAgencies, getCustomers } from '../services/api';

const { TextArea } = Input;

interface ProductFormProps {
  form: any;
  initialValues?: Product;
  error?: string | null;
  onSubmit: (values: ProductFormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

// Custom renderer for size tags (using a neutral color)
const sizeTagRender = (props: CustomTagProps) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
      event.preventDefault();
      event.stopPropagation();
    };
    return (
      <Tag
        color="default"
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  initialValues,
  error,
  onSubmit,
  onCancel,
  isEditing,
}) => {
  const [agencyOptions, setAgencyOptions] = useState<{ label: string; value: string }[]>([]);
  const [storeOptions, setStoreOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    getAgencies().then(data => {
      setAgencyOptions(data.map(a => ({ label: a.agency_name, value: a.agency_name })));
    });
    getCustomers().then(data => {
      setStoreOptions(data.map(c => ({ label: c.store_name, value: c.store_name })));
    });
  }, []);

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onSubmit}
      initialValues={initialValues}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form.Item
        name="name"
        label="Product Name"
        rules={[VALIDATION_RULES.REQUIRED]}
      >
        <Input placeholder="Enter product name" />
      </Form.Item>

      <Form.Item
        name="sku"
        label="SKU"
        rules={[VALIDATION_RULES.REQUIRED, VALIDATION_RULES.SKU]}
      >
        <Input placeholder="Enter SKU" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
      >
        <TextArea rows={3} placeholder="Enter product description" />
      </Form.Item>

      <Form.Item
        name="unit_price"
        label="Unit Price (₹)"
        rules={[VALIDATION_RULES.REQUIRED, VALIDATION_RULES.PRICE]}
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          placeholder="Enter unit price in ₹"
        />
      </Form.Item>

      <Form.Item
        name="sizes"
        label="Sizes"
      >
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="Type and press Enter to add sizes"
          tagRender={sizeTagRender}
        />
      </Form.Item>

      <Form.Item
        name="allowed_agencies"
        label="Allowed Agencies"
        rules={[{ required: true, message: 'Please select at least one allowed agency' }]}
      >
        <Select
          mode="multiple"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          placeholder="Select allowed agencies"
          options={agencyOptions}
        />
      </Form.Item>

      <Form.Item
        name="allowed_stores"
        label="Allowed Stores"
        rules={[]}
      >
        <Select
          mode="multiple"
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          placeholder="Select allowed stores (optional)"
          options={storeOptions}
        />
      </Form.Item>

      <Form.Item
        label="Colors & Colour Codes"
        required={false}
      >
        <Form.List name="colors">
          {(fields, { add, remove }) => (
            <>
              {Array.isArray(fields) ? fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'color']}
                    rules={[{ required: true, message: 'Missing color' }]}
                  >
                    <Input placeholder="Color" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'colour_code']}
                    rules={[{ required: true, message: 'Missing colour code' }]}
                  >
                    <InputNumber placeholder="Colour Code" min={0} />
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              )) : null}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                  Add Color
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            {isEditing ? 'Update' : 'Add Product'}
          </Button>
          <Button onClick={onCancel}>
            Cancel
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProductForm; 