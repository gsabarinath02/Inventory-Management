// Product related types
export interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    unit_price: number;
    sizes: string[];
    colors: { color: string; colour_code: number }[];
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
    quantity: number;
    unit_cost: number;
    size?: string;
    color?: string;
    color_name?: string;
    colour_code?: number;
    category?: string;
    supplier?: string;
    notes?: string;
    created_at: string;
}

// Sales types
export interface SalesLog {
    id: number;
    product_id: number;
    date?: string;
    quantity: number;
    unit_price: number;
    size?: string;
    color?: string;
    color_name?: string;
    colour_code?: number;
    category?: string;
    customer?: string;
    notes?: string;
    created_at: string;
}

// Form types
export interface ProductFormData {
    name: string;
    sku: string;
    description?: string;
    unit_price: number;
    sizes: string[];
    colors: { color: string; colour_code: number }[];
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