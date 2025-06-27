import { message } from 'antd';
import dayjs from 'dayjs';

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

export const showSuccess = (msg: string) => {
  message.success(msg);
};

export const showWarning = (msg: string) => {
  message.warning(msg);
};

export const showInfo = (msg: string) => {
  message.info(msg);
};

// Data transformation utilities
export const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined) return '₹0.00';
  return `₹${amount.toFixed(2)}`;
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
export const getColor = (color: string | { color: string }): string => {
  const colorName = typeof color === 'string' ? color : color.color;
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

export interface ParsedExcelRow {
  date: string;
  color: string;
  colour_code: number;
  sizes: Record<string, number>;
  category?: string;
  stakeholder_name?: string;
  agency_name?: string;
  store_name?: string;
}

export interface ExcelParseResult {
  success: boolean;
  data?: ParsedExcelRow[];
  error?: string;
}

export const parseExcelData = (
  excelText: string, 
  availableSizes: string[], 
  isInward: boolean = true
): ExcelParseResult => {
  try {
    const lines = excelText.trim().split('\n');
    if (lines.length === 0) {
      return { success: false, error: 'No data provided' };
    }

    const parsedRows: ParsedExcelRow[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = line.split('\t');
      
      // Expected columns: Date, Colour Code, Color, S, M, L, XL, ..., Category, Stakeholder/Store
      const expectedColumns = 3 + availableSizes.length + 1; // Date, Colour Code, Color, Sizes, Category/Agency, Stakeholder/Store
      
      if (columns.length < expectedColumns) {
        return { 
          success: false, 
          error: `Row ${i + 1}: Expected ${expectedColumns} columns, got ${columns.length}` 
        };
      }
      
      // Parse date
      let dateStr = columns[0].trim();
      let parsedDate = dayjs(dateStr, 'YYYY-MM-DD', true);
      if (!parsedDate.isValid()) {
        // Try to auto-convert common formats
        const tryFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MM-YYYY', 'MM-DD-YYYY', 'YYYY/MM/DD'];
        for (const fmt of tryFormats) {
          const tryDate = dayjs(dateStr, fmt, true);
          if (tryDate.isValid()) {
            parsedDate = tryDate;
            dateStr = tryDate.format('YYYY-MM-DD');
            break;
          }
        }
      }
      if (!parsedDate.isValid()) {
        return { 
          success: false, 
          error: `Row ${i + 1}: Invalid date format. Use YYYY-MM-DD or a common format like DD/MM/YYYY, MM/DD/YYYY, etc.` 
        };
      }
      dateStr = parsedDate.format('YYYY-MM-DD');
      
      // Parse colour code
      const colourCode = parseInt(columns[1].trim());
      if (isNaN(colourCode)) {
        return { 
          success: false, 
          error: `Row ${i + 1}: Invalid colour code` 
        };
      }
      // Parse color
      const color = columns[2].trim();
      if (!color) {
        return { 
          success: false, 
          error: `Row ${i + 1}: Color is required` 
        };
      }
      
      // Parse sizes
      const sizes: Record<string, number> = {};
      for (let j = 0; j < availableSizes.length; j++) {
        const sizeValue = parseInt(columns[3 + j].trim() || '0');
        if (isNaN(sizeValue) || sizeValue < 0) {
          return { 
            success: false, 
            error: `Row ${i + 1}: Invalid size value for ${availableSizes[j]}` 
          };
        }
        if (sizeValue > 0) {
          sizes[availableSizes[j]] = sizeValue;
        }
      }
      
      // Check if at least one size has quantity > 0
      if (Object.keys(sizes).length === 0) {
        return { 
          success: false, 
          error: `Row ${i + 1}: At least one size must have quantity > 0` 
        };
      }
      
      // Parse category (for inward) or agency/store (for sales)
      const categoryIndex = 3 + availableSizes.length;
      const stakeholderIndex = categoryIndex + 1;
      
      const row: ParsedExcelRow = {
        date: dateStr,
        colour_code: colourCode,
        color,
        sizes,
      };
      
      if (isInward) {
        // For inward logs: Category, Stakeholder
        row.category = columns[categoryIndex]?.trim() || 'Supply';
        row.stakeholder_name = columns[stakeholderIndex]?.trim() || '';
      } else {
        // For sales logs: Agency, Store
        row.agency_name = columns[categoryIndex]?.trim() || '';
        row.store_name = columns[stakeholderIndex]?.trim() || '';
      }
      
      parsedRows.push(row);
    }
    
    if (parsedRows.length === 0) {
      return { success: false, error: 'No valid rows found' };
    }
    
    return { success: true, data: parsedRows };
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to parse Excel data: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}; 