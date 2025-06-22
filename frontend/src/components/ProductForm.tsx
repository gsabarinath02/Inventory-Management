import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Alert, Button, Space, Tag } from 'antd';
import { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { ProductFormData, Product } from '../types';
import { VALIDATION_RULES } from '../constants';
import { getColor } from '../utils';

const { TextArea } = Input;

interface ProductFormProps {
  form: any;
  initialValues?: Product;
  error?: string | null;
  onSubmit: (values: ProductFormData) => void;
  onCancel: () => void;
  isEditing: boolean;
}

// Custom renderer for color tags
const colorTagRender = (props: CustomTagProps) => {
  const { label, value, closable, onClose } = props;
  const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };
  return (
    <Tag
      color={getColor(value)}
      onMouseDown={onPreventMouseDown}
      closable={closable}
      onClose={onClose}
      style={{ marginRight: 3 }}
    >
      {label}
    </Tag>
  );
};

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
        label="Unit Price"
        rules={[VALIDATION_RULES.REQUIRED, VALIDATION_RULES.PRICE]}
      >
        <InputNumber
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          placeholder="Enter unit price"
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
        name="colors"
        label="Colors"
      >
        <Select
          mode="tags"
          style={{ width: '100%' }}
          placeholder="Type and press Enter to add colors"
          tagRender={colorTagRender}
        />
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