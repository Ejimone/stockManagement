# Stock Management System API Documentation

## Overview

The Stock Management System provides a REST API for managing inventory, sales, payments, and user accounts. The system supports two user roles:

- **Admin**: Full system access including user management, all sales data, and inventory control
- **Salesperson**: Limited access to their own sales, product viewing, and sale creation

## Base URL

```
http://localhost:8000/api/
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

#### Login

- **POST** `/auth/login/`
- **Body**: `{"email": "user@example.com", "password": "password"}`
- **Response**:

```json
{
  "refresh": "refresh_token_here",
  "access": "access_token_here",
  "user": {
    "id": 1,
    "email": "admin@jonkech.com",
    "full_name": "Admin User",
    "role": "Admin",
    "is_active": true
  }
}
```

#### Refresh Token

- **POST** `/auth/refresh/`
- **Body**: `{"refresh": "refresh_token_here"}`
- **Response**: `{"access": "new_access_token_here"}`

#### Current User

- **GET** `/auth/me/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: User profile data

## API Endpoints

### Users (Admin Only)

#### List/Create Users

- **GET** `/users/` - List all users
- **POST** `/users/` - Create new user
- **Query Parameters**:
  - `role`: Filter by role (Admin/Salesperson)

#### User Details

- **GET** `/users/{id}/` - Get user details
- **PUT** `/users/{id}/` - Update user
- **DELETE** `/users/{id}/` - Deactivate user (soft delete)

### Products

#### List/Create Products

- **GET** `/products/` - List products (All users)
- **POST** `/products/` - Create product (Admin only)
- **Query Parameters**:
  - `active_only`: Filter active products (default: true)
  - `category`: Filter by category
  - `stock_status`: Filter by stock status (in_stock, low_stock, out_of_stock)
  - `search`: Search by name or SKU

**Sample Response**:

```json
{
  "count": 20,
  "results": [
    {
      "id": 1,
      "name": "iPhone 14",
      "description": "Latest smartphone from Apple",
      "sku": "IPHONE14",
      "price": "999.99",
      "stock_quantity": 49,
      "category": "Electronics",
      "is_active": true,
      "stock_status": "in_stock",
      "created_at": "2025-06-07T02:15:03.263507Z",
      "updated_at": "2025-06-07T02:19:35.234664Z"
    }
  ]
}
```

#### Product Details

- **GET** `/products/{id}/` - Get product details
- **PUT** `/products/{id}/` - Update product (Admin only)
- **DELETE** `/products/{id}/` - Deactivate product (Admin only)

### Sales

#### List/Create Sales

- **GET** `/sales/` - List sales (role-based filtering)
- **POST** `/sales/` - Create new sale
- **Query Parameters**:
  - `date_from`: Filter from date (YYYY-MM-DD)
  - `date_to`: Filter to date (YYYY-MM-DD)
  - `payment_status`: Filter by payment status (paid, partial, unpaid)
  - `salesperson`: Filter by salesperson ID (Admin only)

**Create Sale Request**:

```json
{
  "customer_name": "John Customer",
  "customer_contact": "john@example.com",
  "payment_method": "cash",
  "amount_paid": 100.0,
  "notes": "Customer notes",
  "products_sold_data": [
    {
      "product_id": 1,
      "quantity": 2
    },
    {
      "product_id": 3,
      "quantity": 1
    }
  ]
}
```

#### Sale Details

- **GET** `/sales/{id}/` - Get sale details
- **PUT** `/sales/{id}/` - Update sale (limited fields)

### Payments (Admin Only)

#### List/Create Payments

- **GET** `/payments/` - List all payments
- **POST** `/payments/` - Record new payment
- **Query Parameters**:
  - `sale`: Filter by sale ID
  - `status`: Filter by payment status
  - `date_from`: Filter from date
  - `date_to`: Filter to date

**Create Payment Request**:

```json
{
  "sale": 1,
  "amount": 500.0,
  "payment_method": "credit_card",
  "reference_number": "REF123456",
  "notes": "Payment notes"
}
```

#### Payment Details

- **GET** `/payments/{id}/` - Get payment details
- **PUT** `/payments/{id}/` - Update payment

### Reports

#### Dashboard Statistics

- **GET** `/dashboard/`
- **Admin Response**:

```json
{
  "total_sales_today": 20,
  "total_revenue_today": 18368.18,
  "total_sales_this_month": 20,
  "total_revenue_this_month": 18368.18,
  "total_products": 20,
  "low_stock_products": 1,
  "out_of_stock_products": 0,
  "total_salespersons": 5,
  "pending_payments": 0
}
```

- **Salesperson Response**:

```json
{
  "my_sales_today": 1,
  "my_revenue_today": 1139.96,
  "my_sales_this_month": 1,
  "my_revenue_this_month": 1139.96,
  "my_pending_sales": 0,
  "my_pending_amount": 0
}
```

#### Sales Report

- **GET** `/reports/sales/`
- **Query Parameters**:
  - `date_from`: Start date (YYYY-MM-DD)
  - `date_to`: End date (YYYY-MM-DD)
  - `salesperson`: Salesperson ID (Admin only)
  - `payment_status`: Payment status filter

**Response**:

```json
{
  "summary": {
    "total_sales": 20,
    "total_revenue": 18368.18,
    "total_paid": 15000.0,
    "total_balance": 3368.18
  },
  "payment_methods": [
    { "payment_method": "cash", "count": 10, "total": 5000.0 },
    { "payment_method": "credit", "count": 5, "total": 8000.0 }
  ],
  "payment_status": [
    { "payment_status": "paid", "count": 15, "total": 12000.0 },
    { "payment_status": "partial", "count": 3, "total": 4000.0 }
  ],
  "top_products": [
    {
      "product__name": "iPhone 14",
      "product__sku": "IPHONE14",
      "total_quantity": 10,
      "total_revenue": 9999.9
    }
  ]
}
```

#### Inventory Report (Admin Only)

- **GET** `/reports/inventory/`
- **Query Parameters**:
  - `category`: Filter by category
  - `stock_status`: Filter by stock status
  - `active_only`: Include only active products (default: true)

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message here"
}
```

### Validation Errors

```json
{
  "field_name": ["Error message for this field"],
  "another_field": ["Another error message"]
}
```

### Common HTTP Status Codes

- **200 OK**: Successful GET/PUT request
- **201 Created**: Successful POST request
- **204 No Content**: Successful DELETE request
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Invalid or missing authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Business logic conflict (e.g., insufficient stock)

## Business Rules

### Stock Management

- Stock quantities automatically decrease when sales are created
- Sales cannot be created if insufficient stock is available
- Stock validation is transactional (all-or-nothing)

### Payment Management

- Payments can only be recorded against existing sales
- Payment amounts cannot exceed the remaining balance
- Payment status is automatically updated based on payments

### Role-Based Access

- **Admin**: Full access to all endpoints
- **Salesperson**:
  - Can view all products (read-only)
  - Can create sales
  - Can only view their own sales
  - Cannot access user management or payments
  - Cannot modify products

### Data Validation

- Email addresses must be unique and valid
- SKUs must be unique across products
- Prices and quantities must be positive numbers
- Stock quantities cannot be negative

## Sample Requests

### Create a Sale

```bash
curl -X POST http://localhost:8000/api/sales/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Jane Smith",
    "customer_contact": "+1234567890",
    "payment_method": "cash",
    "amount_paid": 1299.98,
    "products_sold_data": [
      {"product_id": 1, "quantity": 1},
      {"product_id": 5, "quantity": 2}
    ]
  }'
```

### Add a Product (Admin Only)

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "sku": "NEW-PROD-001",
    "price": 99.99,
    "stock_quantity": 100,
    "category": "Electronics"
  }'
```

### Record a Payment (Admin Only)

```bash
curl -X POST http://localhost:8000/api/payments/ \
  -H "Authorization: Bearer <admin_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sale": 1,
    "amount": 500.00,
    "payment_method": "bank_transfer",
    "reference_number": "TXN123456",
    "notes": "Payment received via bank transfer"
  }'
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting based on user roles and endpoint sensitivity.

## Security Considerations

- All API endpoints require authentication except `/auth/login/`
- JWT tokens expire after 24 hours (access) and 7 days (refresh)
- Role-based permissions are enforced at the API level
- Input validation prevents SQL injection and XSS attacks
- Passwords are hashed using Django's built-in password hashers

## Development and Testing

### Sample Users

The system includes sample data with these test users:

- **Admin**: `admin@jonkech.com` / `admin123`
- **Salesperson**: `john.doe@jonkech.com` / `password123`

### Running the Server

```bash
cd backend
python manage.py runserver 8000
```

### Creating Sample Data

```bash
python manage.py create_sample_data
```

This creates 6 users, 20 products, 20 sales, and 3 payments for testing purposes.
