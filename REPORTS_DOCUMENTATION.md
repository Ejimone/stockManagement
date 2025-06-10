# Reports Feature Documentation

## Overview

The Reports feature provides comprehensive analytics and reporting capabilities for both Admin and Salesperson roles in the Stock Management System.

## Features

### Admin Reports (`/admin/reports`)

The admin reports page includes:

1. **Interactive Chart**

   - Daily sales trend line chart with 7, 30, or 90-day periods
   - Shows sales amounts over time with smooth bezier curves
   - Interactive period selector

2. **Summary Dashboard**

   - Total Sales count and revenue
   - Product inventory overview with alerts
   - Outstanding payments summary
   - Collection rate metrics

3. **Inventory Status**

   - Visual indicators for stock levels (Out of Stock, Low Stock, In Stock)
   - Detailed lists of low stock and out of stock items
   - Color-coded alerts (Red: Out of Stock, Orange: Low Stock, Green: In Stock)

4. **Credits & Outstanding Payments**

   - Total outstanding balance
   - Lists of unpaid and partially paid sales
   - Customer contact information for follow-up

5. **Top Selling Products**
   - Ranked list of best-performing products
   - Sales quantity and revenue metrics
   - Product details (SKU, price)

### Salesperson Reports (`/sales/reports`)

The salesperson reports page includes:

1. **Personal Sales Chart**

   - Individual sales performance over time
   - Personal daily sales trend with blue theme

2. **Performance Summary**

   - Personal sales metrics
   - Collection rate tracking
   - Outstanding customer payments
   - Average sale value

3. **Payment Status Breakdown**

   - Visual breakdown of paid, partial, and unpaid sales
   - Color-coded status indicators

4. **Personal Credit Sales**

   - List of customers with outstanding balances
   - Unpaid and partial payment tracking
   - Customer contact information

5. **Top Personal Products**

   - Best-selling products for the individual salesperson
   - Personal performance metrics

6. **Recent Activity**
   - Recent sales transactions
   - Recent payment collections
   - Real-time activity feed

## Backend API

### Endpoint: `/api/reports/comprehensive/`

**Method:** GET  
**Authentication:** Required  
**Permissions:** Admin (full access), Salesperson (filtered to own data)

#### Query Parameters:

- `date_from` (optional): Start date in YYYY-MM-DD format
- `date_to` (optional): End date in YYYY-MM-DD format

#### Response Structure:

```json
{
  "chart_data": [
    {
      "date": "2024-01-01",
      "sales_amount": 1500.00,
      "sales_count": 5
    }
  ],
  "sales_summary": {
    "total_sales": 50,
    "total_revenue": 25000.00,
    "total_paid": 20000.00,
    "total_balance": 5000.00
  },
  "payment_status_breakdown": [
    {
      "payment_status": "paid",
      "count": 30,
      "total": 15000.00
    }
  ],
  "top_products": [
    {
      "product__name": "Product Name",
      "product__sku": "SKU123",
      "product__price": 100.00,
      "total_quantity": 25,
      "total_revenue": 2500.00
    }
  ],
  "inventory_status": {
    "total_products": 100,
    "out_of_stock": 5,
    "low_stock": 10,
    "in_stock": 85,
    "low_stock_items": [...],
    "out_of_stock_items": [...]
  },
  "credit_summary": {
    "total_unpaid_sales": 5,
    "total_partial_sales": 8,
    "total_outstanding_balance": 5000.00,
    "unpaid_sales": [...],
    "partial_sales": [...]
  },
  "recent_activity": {
    "sales": [...],
    "payments": [...]
  },
  "period": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  }
}
```

## Frontend Implementation

### Key Components:

1. **Period Selector** - Interactive buttons for 7, 30, 90-day periods
2. **Line Chart** - React Native Chart Kit for sales visualization
3. **Summary Cards** - Color-coded metric cards
4. **Data Lists** - Scrollable lists for detailed information
5. **Pull to Refresh** - Real-time data updates

### Styling:

- Modern card-based layout with shadows
- Color-coded indicators (Green: positive, Red: alerts, Blue: neutral)
- Responsive grid layout for summary cards
- Professional typography and spacing

### Data Flow:

1. Component mounts and fetches data for default 30-day period
2. User can change time period via selector buttons
3. Pull-to-refresh allows manual data updates
4. Role-based filtering (Admin sees all data, Salesperson sees own data)

## Error Handling

- Loading states with spinner indicators
- Error alerts for API failures
- Graceful handling of empty data states
- Fallback messages for missing chart data

## Security

- JWT authentication required
- Role-based data filtering at API level
- Admin-only inventory data access
- Salesperson data isolation

## Performance Considerations

- Efficient database queries with aggregations
- Limited result sets for large lists (top 10 products, etc.)
- Chart data optimized for mobile rendering
- Caching considerations for frequently accessed data

## Future Enhancements

- Export functionality (PDF, Excel)
- Advanced filtering options
- Real-time notifications for alerts
- Comparative period analysis
- Goal setting and tracking
