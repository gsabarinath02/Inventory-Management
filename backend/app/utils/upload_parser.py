import pandas as pd
from typing import List, Dict, Any, Tuple
from io import BytesIO, StringIO

def parse_upload_file(file_bytes: bytes, file_type: str = 'excel') -> Tuple[List[Dict[str, Any]], List[str]]:
    """
    Parses an Excel or CSV file and returns a list of log dicts and a list of errors.
    Each log dict contains: date, color_code, color, size, quantity, category, stakeholder (party/agency/store).
    """
    errors = []
    logs = []
    try:
        if file_type == 'excel':
            df = pd.read_excel(BytesIO(file_bytes))
        else:
            df = pd.read_csv(StringIO(file_bytes.decode('utf-8')))
    except Exception as e:
        errors.append(f"Failed to read file: {e}")
        return [], errors

    # Normalize column names
    df.columns = [str(col).strip().lower().replace(' ', '_') for col in df.columns]
    size_columns = [col for col in df.columns if col in ['s','m','l','xl','xxl','3xl','4xl','5xl']]
    required_cols = ['date', 'color_cod', 'color', 'category']
    if not all(col in df.columns for col in required_cols):
        errors.append(f"Missing required columns. Found: {df.columns.tolist()}")
        return [], errors

    for idx, row in df.iterrows():
        try:
            base = {
                'date': str(row['date']),
                'color_code': int(row['color_cod']) if 'color_cod' in row else int(row['color_code']),
                'color': str(row['color']),
                'category': str(row['category']) if 'category' in row else '',
                'stakeholder': '',  # Default to empty string
            }
            for field in ['party_name', 'agency_name', 'store_name']:
                if field in df.columns and row.get(field) not in (None, ""):
                    base['stakeholder'] = str(row[field])
                    break
            for size in size_columns:
                qty = row.get(size, 0)
                if qty is not None and not pd.isna(qty) and int(qty) > 0:
                    log = base.copy()
                    log['size'] = size.upper()
                    log['quantity'] = int(qty)
                    logs.append(log)
        except Exception as e:
            row_num = idx + 2 if isinstance(idx, int) else 0
            errors.append(f"Row {row_num}: {e}")
    return logs, errors 