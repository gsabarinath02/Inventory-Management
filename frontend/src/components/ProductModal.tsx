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

  // Defensive transformation for legacy data
  let safeInitialValues = editingProduct ? { ...editingProduct } : undefined;
  if (safeInitialValues && Array.isArray(safeInitialValues.colors)) {
    safeInitialValues.colors = safeInitialValues.colors.map((c: any) => {
      if (typeof c === 'string') {
        return { color: c, colour_code: 0 };
      }
      if (typeof c === 'object' && c.color && typeof c.colour_code !== 'undefined') {
        return c;
      }
      // fallback for malformed data
      return { color: String(c), colour_code: 0 };
    });
  }

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
        initialValues={safeInitialValues}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isEditing={!!editingProduct}
      />
    </Modal>
  );
};

export default ProductModal; 