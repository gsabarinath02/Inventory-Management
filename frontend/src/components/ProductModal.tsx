import React from 'react';
import { Modal, Form } from 'antd';
import { Product, ProductFormData } from '../types';
import ProductForm from './ProductForm';
import { FORM_CONFIG } from '../constants';

interface ProductModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: ProductFormData) => void;
  editingProduct?: Product | null;
  error?: string | null;
  title?: string;
}

const ProductModal: React.FC<ProductModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  editingProduct,
  error,
  title,
}) => {
  const [form] = Form.useForm();

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  const handleSubmit = (values: ProductFormData) => {
    onSubmit(values);
  };

  const modalTitle = title || (editingProduct ? 'Edit Product' : 'Add Product');

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={FORM_CONFIG.MODAL_WIDTH}
      destroyOnHidden
    >
      <ProductForm
        form={form}
        initialValues={editingProduct || undefined}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={!!editingProduct}
      />
    </Modal>
  );
};

export default ProductModal; 