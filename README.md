# Inventory Management System

A full-stack inventory management tool for products with size/color variants, robust stock tracking, audit logs, and advanced bulk data workflows.  
**Backend:** FastAPI + PostgreSQL | **Frontend:** React + Ant Design

---

## Features

### Backend (FastAPI)
- **Product Management:** CRUD for products with size/color variants and color-code mapping
- **Stock Tracking:** Inward and sales logs with size/color granularity, atomic stock updates
- **Bulk Operations:** Bulk create and delete for logs (API and UI)
- **Quick Retrieval:** Fetch latest log by date and stakeholder/store
- **Audit Logging:** Track all changes for compliance
- **Role-Based Access:** JWT authentication, admin/manager/viewer roles
- **Async SQLAlchemy:** High performance, scalable
- **CORS & Security:** Secure API, input validation, password hashing

### Frontend (React + Ant Design)
- **Modern UI:** Responsive, accessible, and mobile-friendly
- **Product List & Stock Matrix:** Visualize stock by color/size
- **Inward & Sales Logs:** Add, edit, delete, filter, and bulk manage logs
- **Bulk Excel Paste:** Paste tab-delimited data from Excel, preview, validate, and overwrite logs
- **Quick Lookup:** Instantly fetch the latest log by date and stakeholder/store
- **Overwrite Workflow:** Safely replace all logs for a product/date/store with confirmation
- **User Management:** Admin UI for users/roles
- **Audit Logs:** View all system changes
- **Testing:** Unit and integration tests for frontend and backend

---

## Quick Start

### Using Docker Compose (Recommended)

#### Production
```bash
docker-compose up --build -d
```

#### Development (hot reload)
```bash
docker-compose -f docker-compose.dev.yml up --build -d
```

#### Stop Services
```bash
docker-compose down
```

---

### Manual Setup

#### Backend
```bash
cd backend
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Key Workflows

### Bulk Excel Paste (Inward/Sales Logs)
- Open the "Bulk Paste from Excel" panel above the log table.
- Paste tab-delimited data (copied from Excel) in the format:
  ```
  Date	Color	Colour Code	S	M	Category	Stakeholder
  2024-06-27	Red	101	10	5	Supply	Store A
  ```
- Click **Load** to preview and validate.
- If any Color/Colour Code pair is invalid, a warning is shown and loading is blocked.
- After successful load, click **Overwrite** to replace all matching logs (with confirmation).

### Quick Retrieval by Date & Name
- In the Filter panel, use the **Quick Date** and **Store / Supplier** fields.
- Returns only the most recent matching log for that date and name.

### Overwrite Workflow
- After loading bulk data, click **Overwrite**.
- Confirms and then deletes all existing logs for the product/date/store, then bulk-creates the new rows.

---

## API Endpoints

### Products
- `GET /api/v1/products`
- `POST /api/v1/products`
- `PUT /api/v1/products/{id}`
- `DELETE /api/v1/products/{id}`

### Inward Logs
- `GET /api/v1/inward/{product_id}?date=YYYY-MM-DD&stakeholder_name=...`
- `POST /api/v1/inward/`
- `POST /api/v1/inward/bulk-create`
- `DELETE /api/v1/inward/bulk-delete`

### Sales Logs
- `GET /api/v1/sales/{product_id}?date=YYYY-MM-DD&store_name=...`
- `POST /api/v1/sales/`
- `POST /api/v1/sales/bulk-create`
- `DELETE /api/v1/sales/bulk-delete`

### Auth & Users
- `POST /api/v1/auth/login`
- `GET /api/v1/users/` (admin only)
- See `AUTHENTICATION_README.md` for full details

---

## Data Model Example

### Product
```json
{
  "id": 1,
  "name": "T-Shirt",
  "sku": "TS001",
  "sizes": ["S", "M", "L"],
  "colors": [{"color": "Red", "colour_code": 101}, ...]
}
```

### Inward/Sales Log
```json
{
  "product_id": 1,
  "date": "2024-06-27",
  "color": "Red",
  "colour_code": 101,
  "sizes": {"S": 10, "M": 5},
  "category": "Supply", // Inward only
  "stakeholder_name": "Store A", // Inward only
  "agency_name": "Agency X", // Sales only
  "store_name": "Store Y", // Sales only
  "operation": "Inward" // or "Sale"
}
```

---

## Bulk Paste Format

**Inward Log:**
```
Date	Color	Colour Code	S	M	Category	Stakeholder
2024-06-27	Red	101	10	5	Supply	Store A
```

**Sales Log:**
```
Date	Color	Colour Code	S	M	Agency	Store
2024-06-27	Red	101	2	1	Agency X	Store Y
```

- Columns must match your product's sizes and color-code pairs.
- Invalid color/code pairs are blocked with a warning.

---

## Testing

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm test
```

---

## Security & Best Practices

- All sensitive endpoints require JWT authentication.
- Role-based access enforced on backend and frontend.
- All user input is validated and sanitized.
- Passwords are hashed and never stored in plain text.
- CORS and rate limiting enabled.

---

## Troubleshooting

- See the "Troubleshooting" section in this README for common issues and solutions.
- For authentication/user management, see `AUTHENTICATION_README.md`.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes (with tests)
4. Submit a pull request

---

## License

MIT License - see LICENSE file for details.

---

**For more details on authentication and user management, see `AUTHENTICATION_README.md`.** 