# Jonkech Stock Management System

A comprehensive stock management application built with Django (backend) and designed for React Native (frontend). This system provides role-based access control for Admins and Salespersons to manage inventory, sales, and reporting.

## Features

- **User Management**: Role-based access (Admin/Salesperson)
- **Product Management**: Full CRUD operations for inventory
- **Sales Management**: Create sales, track payments, automatic stock updates
- **Payment Tracking**: Record payments against credit sales
- **Reporting**: Sales reports, inventory reports, dashboard analytics
- **RESTful API**: Complete API for frontend integration

## Quick Start

1. **Setup Environment**

   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   ```

2. **Create Admin User**

   ```bash
   python manage.py createsuperuser
   ```

3. **Create Sample Data (Optional)**

   ```bash
   python manage.py setup_system --create-sample-products
   ```

4. **Run Server**

   ```bash
   python manage.py runserver
   ```

5. **Access Admin Panel**
   Visit: http://127.0.0.1:8000/admin/

## Documentation

- [Complete Setup Guide](SETUP_GUIDE.md)
- [API Documentation](backend/API_DOCUMENTATION.md)
- [Models Documentation](backend/MODELS_DOCUMENTATION.md)

## Architecture

- **Backend**: Django REST Framework
- **Database**: SQLite (development), PostgreSQL (production)
- **Authentication**: JWT tokens
- **Frontend**: React Native (planned)

## API Endpoints

| Endpoint                  | Method   | Role      | Description         |
| ------------------------- | -------- | --------- | ------------------- |
| `/api/auth/login/`        | POST     | All       | User authentication |
| `/api/products/`          | GET/POST | All/Admin | Product management  |
| `/api/sales/`             | GET/POST | All       | Sales management    |
| `/api/users/`             | GET/POST | Admin     | User management     |
| `/api/reports/dashboard/` | GET      | All       | Dashboard data      |

## User Roles

### Admin

- Manage products and users
- View all sales data
- Record payments
- Access all reports

### Salesperson

- Create sales transactions
- View own sales history
- Update stock levels through sales
- Access personal reports

## Testing

Run the test suite:

```bash
python manage.py test salesperson.test_api
```

## License

Private project - All rights reserved.
