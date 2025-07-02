import { Form, Input, InputNumber, Select, Alert, Button, Space, Tag, Card, Row, Col, Tooltip, Divider, Steps, message } from 'antd';
import { CustomTagProps } from 'rc-select/lib/BaseSelect';
import { ProductFormData, Product } from '../types';
import { VALIDATION_RULES } from '../constants';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useState, useRef } from 'react';
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
  const [currentStep, setCurrentStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const successAlertRef = useRef<HTMLDivElement>(null);

  const steps = [
    { title: 'Basic Info' },
    { title: 'Availability' },
    { title: 'Colors' },
  ];

  useEffect(() => {
    getAgencies().then(data => {
      setAgencyOptions(data.map(a => ({ label: a.agency_name, value: a.agency_name })));
    });
    getCustomers().then(data => {
      setStoreOptions(data.map(c => ({ label: c.store_name, value: c.store_name })));
    });
  }, []);

  const handleFinish = (values: ProductFormData) => {
    onSubmit(values);
    setSuccess(true);
    message.success(isEditing ? 'Product updated successfully!' : 'Product added successfully!');
    setTimeout(() => {
      if (successAlertRef.current) {
        successAlertRef.current.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div style={{ background: '#f7fafd', minHeight: '100vh', padding: '32px 0' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px' }}>
        <Card
          title={
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{isEditing ? 'Edit Product' : 'Add New Product'}</div>
              <div style={{ color: '#888', fontSize: 15, marginTop: 4 }}>
                Fill in the details below to {isEditing ? 'update' : 'add'} a product. All required fields are marked with *. <span style={{ color: '#aaa', fontSize: 13 }}>Tab/Shift+Tab to navigate fields, Enter to submit.</span>
              </div>
            </div>
          }
          bordered={false}
          style={{ boxShadow: '0 2px 16px #e5e7eb', borderRadius: 16, animation: 'fadeIn 0.7s' }}
          bodyStyle={{ padding: 32 }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: none; }
            }
          `}</style>
          <Steps
            current={currentStep}
            items={steps}
            style={{ marginBottom: 32 }}
            responsive
            aria-label="Product form steps"
          />
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={initialValues}
            onFieldsChange={(_, allFields) => {
              if (allFields.some(f => ['name', 'sku', 'unit_price', 'sizes', 'description'].includes(f.name[0]))) setCurrentStep(0);
              else if (allFields.some(f => ['allowed_agencies', 'allowed_stores'].includes(f.name[0]))) setCurrentStep(1);
              else if (allFields.some(f => f.name[0] === 'colors')) setCurrentStep(2);
            }}
            aria-label="Add Product Form"
            data-testid="product-form"
          >
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                role="alert"
              />
            )}
            {success && (
              <div ref={successAlertRef} tabIndex={-1} role="status">
                <Alert
                  message="Success"
                  description={isEditing ? 'Product updated successfully!' : 'Product added successfully!'}
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              </div>
            )}
            <Alert
              message="Note"
              description="Stores and agencies must be registered before they can be selected here. If you don't see the store or agency you want, please register it first."
              type="info"
              showIcon
              style={{ marginBottom: 24, background: '#f6f8fa', border: '1px solid #e5e7eb', borderRadius: 8 }}
              role="note"
            />
            <Divider orientation="left" style={{ fontWeight: 600 }}>Basic Information</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label="Product Name"
                  rules={[VALIDATION_RULES.REQUIRED]}
                >
                  <Input placeholder="Enter product name" autoFocus aria-required="true" aria-label="Product Name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="sku"
                  label={
                    <span>
                      SKU
                      <Tooltip title="Stock Keeping Unit - must be unique">
                        <span style={{ color: '#888', marginLeft: 4, cursor: 'pointer' }}>ⓘ</span>
                      </Tooltip>
                    </span>
                  }
                  rules={[VALIDATION_RULES.REQUIRED, VALIDATION_RULES.SKU]}
                >
                  <Input placeholder="Enter SKU" aria-required="true" aria-label="SKU" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
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
                    aria-required="true"
                    aria-label="Unit Price"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="sizes"
                  label={
                    <span>
                      Sizes
                      <Tooltip title="Type and press Enter to add sizes (e.g., S, M, L, XL)">
                        <span style={{ color: '#888', marginLeft: 4, cursor: 'pointer' }}>ⓘ</span>
                      </Tooltip>
                    </span>
                  }
                >
                  <Select
                    mode="tags"
                    style={{ width: '100%' }}
                    placeholder="Type and press Enter to add sizes"
                    tagRender={sizeTagRender}
                    aria-label="Sizes"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item
              name="description"
              label="Description"
            >
              <TextArea rows={3} placeholder="Enter product description" aria-label="Description" />
            </Form.Item>
            <Divider orientation="left" style={{ fontWeight: 600 }}>Availability</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
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
                    aria-label="Allowed Agencies"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
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
                    aria-label="Allowed Stores"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left" style={{ fontWeight: 600 }}>Colors & Colour Codes</Divider>
            <Form.List name="colors">
              {(fields, { add, remove }) => (
                <React.Fragment>
                  {Array.isArray(fields) ? fields.map(({ key, name, ...restField }) => (
                    <React.Fragment key={key}>
                      <Row gutter={12} align="middle" style={{ marginBottom: 0 }}>
                        <Col xs={24} sm={6} style={{ marginBottom: 0 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'color']}
                            rules={[{ required: true, message: 'Missing color' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Color" aria-label="Color" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={7} style={{ marginBottom: 0 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'colour_code']}
                            rules={[{ required: true, message: 'Missing colour code' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber placeholder="Colour Code" min={0} style={{ width: '100%' }} aria-label="Colour Code" />
                          </Form.Item>
                        </Col>
                        <Col xs={24} sm={2} style={{ textAlign: 'right', marginBottom: 0 }}>
                          <Button icon={<MinusCircleOutlined />} onClick={() => remove(name)} danger type="text" aria-label="Remove Color Row" />
                        </Col>
                      </Row>
                      <Row gutter={12} style={{ marginBottom: 8 }}>
                        <Col xs={0} sm={6} />
                        <Col xs={24} sm={7}>
                          <div style={{ color: '#aaa', fontSize: 12, marginTop: 2, marginBottom: 0, paddingLeft: 2 }}>
                            Numeric code for the color (e.g., 101 for Red)
                          </div>
                        </Col>
                      </Row>
                    </React.Fragment>
                  )) : null}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block aria-label="Add Color Row">
                      Add Color
                    </Button>
                  </Form.Item>
                </React.Fragment>
              )}
            </Form.List>
            <Divider style={{ margin: '32px 0 16px' }} />
            <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" size="large" style={{ minWidth: 140 }} aria-label={isEditing ? 'Update Product' : 'Add Product'} data-testid="submit-product">
                  {isEditing ? 'Update Product' : 'Add Product'}
                </Button>
                <Button onClick={onCancel} size="large" style={{ minWidth: 100 }} aria-label="Cancel Product Form" data-testid="cancel-product">
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default ProductForm; 