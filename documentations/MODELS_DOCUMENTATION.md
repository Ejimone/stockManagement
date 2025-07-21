# Jonkech Stock Management System - Models Documentation

## Overview

Successfully created comprehensive Django models for the Jonkech Stock Management System following the project specifications.

## Models Created

### 1. User Model (Custom User)

- **Purpose**: Custom user model extending Django's AbstractUser
- **Key Features**:
  - Role-based access control (Admin/Salesperson)
  - Email as login field instead of username
  - Full name property method
  - Helper methods for role checking

**Fields**:

- `email` (EmailField, unique, required)
- `username` (CharField, inherited)
- `first_name` & `last_name` (CharField, inherited)
- `role` (CharField with choices: Admin/Salesperson)
- `password` (automatically hashed by Django)
- `is_active`, `date_joined` (inherited from AbstractUser)

### 2. Product Model

- **Purpose**: Manages inventory items
- **Key Features**:
  - Stock quantity tracking
  - Soft delete functionality (is_active field)
  - Category-based organization
  - Validation for positive prices and stock

**Fields**:

- `name` (CharField, 255 chars)
- `description` (TextField, optional)
- `sku` (CharField, unique identifier)
- `price` (DecimalField with validation)
- `stock_quantity` (IntegerField with validation)
- `category` (CharField, optional)
- `is_active` (BooleanField for soft delete)
- `created_at` & `updated_at` (DateTimeField)

**Methods**:

- `is_in_stock()` - Check availability
- `is_low_stock()` - Check if below threshold
- `reduce_stock()` & `add_stock()` - Stock management

### 3. Sale Model

- **Purpose**: Records sales transactions
- **Key Features**:
  - Comprehensive payment tracking
  - Customer information (optional)
  - Automatic balance calculation
  - Multiple payment methods support

**Fields**:

- `salesperson` (ForeignKey to User)
- `salesperson_name` (CharField, snapshot)
- `customer_name` & `customer_phone` (optional)
- `products_sold` (JSONField with product details)
- `total_amount`, `amount_paid`, `balance` (DecimalField)
- `payment_method` & `payment_status` (CharField with choices)
- `credit_details` & `notes` (TextField, optional)

**Payment Methods**: Cash, Credit, Mobile Money, Bank Transfer
**Payment Status**: Paid, Partial, Unpaid

### 4. Payment Model

- **Purpose**: Tracks individual payments (especially for credit sales)
- **Key Features**:
  - Multiple payment installments
  - Admin-only recording
  - Payment status tracking
  - Reference number support

**Fields**:

- `sale` (ForeignKey to Sale)
- `amount` (DecimalField)
- `payment_method` (CharField)
- `status` (CharField: Pending/Completed/Failed/Refunded)
- `recorded_by` (ForeignKey to User, Admin only)
- `reference_number` (CharField, optional)
- `notes` (TextField, optional)

### 5. SaleItem Model (Alternative Design)

- **Purpose**: Normalized approach to storing sale items
- **Key Features**:
  - Individual items within a sale
  - Product snapshot data
  - Automatic subtotal calculation

**Fields**:

- `sale` (ForeignKey to Sale)
- `product` (ForeignKey to Product)
- `product_name` & `product_sku` (snapshot data)
- `quantity` (IntegerField)
- `price_at_sale` (DecimalField)
- `subtotal` (DecimalField, calculated)

## Database Configuration

### Custom User Model

```python
AUTH_USER_MODEL = 'salesperson.User'
```

### Django REST Framework Setup

- JWT Authentication configured
- Role-based permissions
- API pagination (20 items per page)
- CORS enabled for cross-origin requests

### Admin Interface

Comprehensive admin interfaces created for all models with:

- List displays with key information
- Search and filter capabilities
- Inline editing for related models
- Read-only timestamp fields

## Sample Data

Created management command `create_sample_data` that generates:

- 1 Admin user (admin@jonkech.com / admin123)
- 5 Salesperson users (e.g., john.doe@jonkech.com / password123)
- 20 Sample products across various categories
- 10 Sample sales with realistic data
- Automatic stock reduction after sales

## Database Indexes

Optimized database performance with indexes on:

- Product: SKU, category, is_active
- Sale: salesperson+created_at, payment_status, payment_method
- Payment: sale+created_at, status, payment_method
- SaleItem: sale, product

## Key Features Implemented

### Security

- Password hashing (Django default)
- Role-based access control
- Input validation with Django validators
- SQL injection prevention (Django ORM)

### Data Integrity

- Foreign key constraints with PROTECT on delete
- Unique constraints where needed
- Automatic balance calculation
- Stock quantity validation

### Performance

- Database indexes on frequently queried fields
- Efficient queries with select_related/prefetch_related opportunities
- Pagination support

### Flexibility

- Dual approach for storing sale items (JSON + normalized)
- Soft delete for products
- Optional customer information
- Extensible payment methods

## Next Steps

1. **Create API Views and Serializers**
2. **Implement JWT Authentication Views**
3. **Add Role-based Permissions**
4. **Create Report Generation Logic**
5. **Add API Documentation with drf-spectacular**
6. **Implement Firebase/Firestore Integration**
7. **Add Unit Tests**
8. **Create Frontend (React Native)**

## File Structure

```
backend/
├── backend/
│   ├── settings.py (Updated with custom user, DRF, JWT)
│   └── ...
├── salesperson/
│   ├── models.py (All models defined)
│   ├── admin.py (Admin interfaces)
│   ├── management/commands/
│   │   └── create_sample_data.py
│   └── migrations/
│       └── 0001_initial.py
├── requirements.txt (Django, DRF, JWT, CORS)
└── db.sqlite3 (Database with sample data)
```

The models are now ready for the next phase of development!
