import { message } from 'antd';

// Date formatting utilities
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

// Error handling utilities
export const handleApiError = (error: any, defaultMessage: string = 'An error occurred'): string => {
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  return defaultMessage;
};

export const showError = (error: any, defaultMessage: string = 'An error occurred'): void => {
  const errorMessage = handleApiError(error, defaultMessage);
  message.error(errorMessage);
};

export const showSuccess = (messageText: string): void => {
  message.success(messageText);
};

// Data transformation utilities
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`;
};

export const formatArrayToString = (array: string[] | undefined): string => {
  return array ? array.join(', ') : '';
};

// Validation utilities
export const isValidId = (id: number | string): boolean => {
  if (typeof id === 'string') {
    const numericId = parseInt(id.split(':')[0], 10);
    return !isNaN(numericId);
  }
  return typeof id === 'number' && id > 0;
};

export const parseProductId = (id: number | string): number | null => {
  if (typeof id === 'string') {
    const numericId = parseInt(id.split(':')[0], 10);
    return isNaN(numericId) ? null : numericId;
  }
  return typeof id === 'number' ? id : null;
};

// Grid utilities
export const createColumnDef = (
  field: string,
  headerName: string,
  options: {
    width?: number;
    flex?: number;
    valueFormatter?: (params: any) => string;
    cellRenderer?: (params: any) => React.ReactElement;
  } = {}
) => {
  return {
    field,
    headerName,
    ...options,
  };
};

// Form utilities
export const resetForm = (form: any): void => {
  form.resetFields();
};

export const setFormValues = (form: any, values: any): void => {
  form.setFieldsValue(values);
};

// Array utilities
export const calculateTotalValue = (products: any[], field: string = 'unit_price'): number => {
  return products.reduce((sum: number, product: any) => sum + (product[field] || 0), 0);
};

// String utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Object utilities
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

// Color utilities
export const getColor = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'red': 'red',
    'blue': 'blue',
    'green': 'green',
    'yellow': 'gold',
    'orange': 'orange',
    'purple': 'purple',
    'pink': 'pink',
    'brown': 'brown',
    'black': 'black',
    'white': 'default',
    'gray': 'default',
    'grey': 'default',
    'cyan': 'cyan',
    'magenta': 'magenta',
    'lime': 'lime',
    'navy': 'blue',
    'maroon': 'red',
    'olive': 'green',
    'teal': 'cyan',
    'silver': 'default',
    'gold': 'gold',
    'indigo': 'blue',
    'violet': 'purple',
    'coral': 'orange',
    'salmon': 'pink',
    'turquoise': 'cyan',
    'plum': 'purple',
    'khaki': 'default',
    'lavender': 'purple',
    'beige': 'default',
    'ivory': 'default',
    'azure': 'blue',
    'mint': 'green',
    'rose': 'pink',
    'amber': 'gold',
    'emerald': 'green',
    'ruby': 'red',
    'sapphire': 'blue',
    'diamond': 'default',
    'pearl': 'default',
    'jade': 'green',
    'aqua': 'cyan',
    'fuchsia': 'pink',
    'bronze': 'orange',
    'copper': 'orange',
    'brass': 'gold',
    'steel': 'default',
    'chrome': 'default',
    'nickel': 'default',
    'zinc': 'default',
    'titanium': 'default',
    'aluminum': 'default',
    'aluminium': 'default',
    'iron': 'default',
    'lead': 'default',
    'tin': 'default',
    'mercury': 'default',
    'platinum': 'default',
    'palladium': 'default',
    'rhodium': 'default',
    'iridium': 'default',
    'osmium': 'default',
    'ruthenium': 'default',
    'rhenium': 'default',
    'tungsten': 'default',
    'molybdenum': 'default',
    'niobium': 'default',
    'tantalum': 'default',
    'vanadium': 'default',
    'chromium': 'default',
    'manganese': 'default',
    'cobalt': 'default',
    'cadmium': 'default',
    'bismuth': 'default',
    'polonium': 'default',
    'astatine': 'default',
    'radon': 'default',
    'francium': 'default',
    'radium': 'default',
    'actinium': 'default',
    'thorium': 'default',
    'protactinium': 'default',
    'uranium': 'default',
    'neptunium': 'default',
    'plutonium': 'default',
    'americium': 'default',
    'curium': 'default',
    'berkelium': 'default',
    'californium': 'default',
    'einsteinium': 'default',
    'fermium': 'default',
    'mendelevium': 'default',
    'nobelium': 'default',
    'lawrencium': 'default',
    'rutherfordium': 'default',
    'dubnium': 'default',
    'seaborgium': 'default',
    'bohrium': 'default',
    'hassium': 'default',
    'meitnerium': 'default',
    'darmstadtium': 'default',
    'roentgenium': 'default',
    'copernicium': 'default',
    'nihonium': 'default',
    'flerovium': 'default',
    'moscovium': 'default',
    'livermorium': 'default',
    'tennessine': 'default',
    'oganesson': 'default'
  };

  if (!colorName) {
    return 'blue'; // Default Ant Design blue
  }

  const lowerCaseColor = colorName.toLowerCase().trim();

  // Check if we have a mapping for this color
  if (colorMap[lowerCaseColor]) {
    return colorMap[lowerCaseColor];
  }

  // The 'color' prop on Ant's Tag can take names like 'red', 'gold', or hex codes.
  // We can validate it by trying to set it as a style color.
  const s = new Option().style;
  s.color = lowerCaseColor;

  // An invalid color will result in an empty string.
  if (s.color !== '') {
    return lowerCaseColor;
  }

  return 'blue'; // Default color if not found
}; 