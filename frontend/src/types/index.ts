// Product related types
export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    unit_price: number;
    sizes: string[];
    colors: { color: string; colour_code: number }[];
    allowed_stores?: string[];
    allowed_agencies?: string[];
    created_at: string;
    updated_at?: string;
}

// Stock related types
export interface ProductColorStock {
  color: string;
  total_stock: number;
  colour_code?: number;
}

export interface StockMatrix {
  [color: string]: {
    [key: string]: number;
  };
}

export interface DetailedStockData {
    product: Product;
    inward_logs: InwardLog[];
    sales_logs: SalesLog[];
    orders: Order[];
}

export interface StockAPIResponse {
  matrix: {
    color: string;
    size: string;
    stock: number;
    inward_quantity: number;
    sales_quantity: number;
  }[];
  product: Product;
}

// Inward/Inventory types
export interface InwardLog {
    id: number;
    product_id: number;
    date?: string;
    color?: string;
    colour_code?: number;
    category?: string;
    stakeholder_name?: string;
    sizes: Record<string, number>;
    operation: string;
    created_at?: string;
}

// Sales types
export interface SalesLog {
    id: number;
    product_id: number;
    date?: string;
    color?: string;
    colour_code?: number;
    agency_name?: string;
    store_name?: string;
    sizes: Record<string, number>;
    operation: string;
    created_at?: string;
    order_number?: number;
}

// Orders types
export interface Order {
    id: number;
    product_id: number;
    order_number: number;
    date?: string;
    color?: string;
    colour_code?: number;
    agency_name?: string;
    store_name?: string;
    sizes: Record<string, number>;
    operation: string;
    created_at?: string;
    fully_delivered?: boolean;
}

// Form types
export interface ProductFormData {
    name: string;
    sku: string;
    description?: string;
    unit_price: number;
    sizes: string[];
    colors: { color: string; colour_code: number }[];
    allowed_stores?: string[];
    allowed_agencies?: string[];
}

// API Response types
export interface ApiResponse<T> {
    data: T;
    message?: string;
}

export interface ApiError {
    detail: string;
    status_code?: number;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  user_id: number;
  username: string;
  action: string;
  entity: string;
  entity_id: number;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
}

export interface Customer {
  id: number;
  store_name: string;
  referrer: 'Nagarajan' | 'Krishna Pranav';
  owner_mobile: string;
  accounts_mobile: string;
  days_of_payment: number;
  gst_number: string;
  address: string;
  pincode: string;
  created_at: string;
  updated_at?: string;
}

export interface Agency {
  id: number;
  agency_name: string;
  owner_mobile: string;
  accounts_mobile: string;
  days_of_payment: number;
  gst_number: string;
  address: string;
  pincode: string;
  region_covered: string;
  created_at: string;
  updated_at?: string;
}

export interface ColorCodePair {
  color: string;
  colour_code: number;
} 