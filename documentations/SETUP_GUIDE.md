# Jonkech Stock Management System - Setup Guide

## Quick Start

### 1. Initial Setup

First, make sure you have the dependencies installed:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

Run migrations to create the database:

```bash
python manage.py migrate
```

### 3. Create Superuser (Admin)

Create the main admin user using Django's built-in command:

```bash
python manage.py createsuperuser
```

This will prompt you for:

- Email address (this will be your login username)
- First name
- Last name
- Password

The superuser will automatically have Admin role and can access both the Django admin panel and all API endpoints.

### 4. Optional: Create Sample Data

To create sample products for testing:

```bash
python manage.py setup_system --create-sample-products
```

### 5. Run the Development Server

```bash
python manage.py runserver
```

## User Management

### Creating Salesperson Users

#### Option 1: Using Django Admin (Recommended)

1. Start the server: `python manage.py runserver`
2. Visit: http://127.0.0.1:8000/admin/
3. Login with your superuser credentials
4. Go to "Users" section
5. Click "Add User"
6. Fill in the details:
   - Email (will be used for login)
   - First name and Last name
   - Role: Select "Salesperson"
   - Password

#### Option 2: Using Management Command

```bash
python manage.py setup_system --create-salesperson salesperson@company.com
```

#### Option 3: Using API (Programmatic)

Send a POST request to `/api/users/` with admin authentication:

```json
{
  "email": "salesperson@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123",
  "role": "Salesperson"
}
```

## API Access

### Authentication

All API endpoints require authentication. Use the login endpoint to get a JWT token:

**POST** `/api/auth/login/`

```json
{
  "email": "user@company.com",
  "password": "password"
}
```

Response:

```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "user": {
    "id": 1,
    "email": "user@company.com",
    "full_name": "User Name",
    "role": "Admin"
  }
}
```

Use the access token in subsequent requests:

```
Authorization: Bearer jwt_access_token
```

### Key API Endpoints

| Endpoint                  | Method   | Role  | Description       |
| ------------------------- | -------- | ----- | ----------------- |
| `/api/auth/login/`        | POST     | All   | User login        |
| `/api/auth/me/`           | GET      | All   | Current user info |
| `/api/products/`          | GET      | All   | List products     |
| `/api/products/`          | POST     | Admin | Create product    |
| `/api/sales/`             | GET/POST | All   | Sales management  |
| `/api/users/`             | GET/POST | Admin | User management   |
| `/api/reports/dashboard/` | GET      | All   | Dashboard data    |
| `/api/reports/sales/`     | GET      | All   | Sales reports     |
| `/api/reports/inventory/` | GET      | Admin | Inventory reports |

## Role-Based Access

### Admin Role

- Full access to all features
- Can manage products (create, update, delete)
- Can manage users (create, update, deactivate)
- Can view all sales from all salespersons
- Can record payments against credit sales
- Can access all reports

### Salesperson Role

- Can view products but cannot modify them
- Can create sales and record transactions
- Can only view their own sales
- Cannot manage other users
- Can access basic sales reports for their own data

## Testing

### Run Tests

```bash
python manage.py test salesperson.test_api
```

### Create Test Data

```bash
python manage.py create_sample_data --users 5 --products 20 --sales 10
```

## Security Notes

1. **Never use default passwords in production**
2. **Always use HTTPS in production**
3. **Set strong JWT secrets in production**
4. **Regularly rotate JWT tokens**
5. **Use environment variables for sensitive settings**

## Production Deployment

1. Set `DEBUG = False` in settings
2. Configure proper database (PostgreSQL recommended)
3. Set up proper static file serving
4. Configure CORS settings for your frontend domain
5. Set secure JWT settings
6. Use environment variables for secrets

## Troubleshooting

### Common Issues

1. **"No admin user found" when creating sample data**

   - Solution: Create a superuser first using `python manage.py createsuperuser`

2. **Authentication errors in API**

   - Check that you're including the JWT token in the Authorization header
   - Verify the token hasn't expired

3. **Permission denied errors**

   - Check that the user has the correct role for the operation
   - Admin operations require Admin role

4. **Database errors**
   - Run `python manage.py migrate` to ensure all migrations are applied

## Next Steps

- Set up the React Native frontend
- Configure Firestore integration (if needed)
- Set up production deployment
- Implement additional business-specific features
