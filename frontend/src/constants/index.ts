// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000/api/v1',
  TIMEOUT: 10000,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  PRODUCTS: '/products',
  STOCK: '/stock',
  INWARD: '/inward',
  SALES: '/sales',
  ORDERS: '/orders',
} as const;

// Grid Configuration
export const GRID_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  DEFAULT_HEIGHT: 500,
} as const;

// Form Configuration
export const FORM_CONFIG = {
  MODAL_WIDTH: 800,
  MODAL_MAX_HEIGHT: 600,
  LAYOUT: {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  },
} as const;

// Navigation
export const NAVIGATION = {
  ROUTES: {
    HOME: '/',
    PRODUCT_VIEW: '/product-view',
    UPLOAD: '/upload',
    USERS: '/users',
  },
  MENU_ITEMS: [
    {
      key: '/',
      label: 'Products',
      icon: 'ShoppingCartOutlined',
    },
    {
      key: '/product-view',
      label: 'Product View',
      icon: 'BarChartOutlined',
    },
    {
      key: '/upload',
      label: 'Upload Data',
      icon: 'UploadOutlined',
    },
    {
      key: '/registration',
      label: 'Registration',
      icon: 'UserAddOutlined',
      adminOnly: true,
    },
  ] as const,
} as const;

// Messages
export const MESSAGES = {
  SUCCESS: {
    PRODUCT_CREATED: 'Product created successfully',
    PRODUCT_UPDATED: 'Product updated successfully',
    PRODUCT_DELETED: 'Product deleted successfully',
    DATA_UPLOADED: 'Data uploaded successfully',
  },
  ERROR: {
    FETCH_PRODUCTS: 'Failed to fetch products',
    CREATE_PRODUCT: 'Failed to create product',
    UPDATE_PRODUCT: 'Failed to update product',
    DELETE_PRODUCT: 'Failed to delete product',
    INVALID_ID: 'Invalid product ID format',
    UNEXPECTED_ERROR: 'An unexpected error occurred',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  REQUIRED: { required: true, message: 'This field is required' },
  PRICE: { type: 'number', min: 0, message: 'Price must be a positive number in ₹' },
  SKU: { pattern: /^[A-Za-z0-9-]+$/, message: 'SKU can only contain letters, numbers, and hyphens' },
} as const; 