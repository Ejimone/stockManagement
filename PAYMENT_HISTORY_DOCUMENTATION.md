# Payment History Feature

## Overview

The Payment History page provides salespersons with a comprehensive view of all payment-related activities. This includes both formal payment records and sales payments, presented in a unified, sortable, and filterable interface.

## Features

### 1. **Unified Payment View**

- **Payment Records**: Official payment entries made by admins
- **Sale Payments**: Payments captured during sales (amount_paid from sales)
- **Visual Distinction**: Different colored tags to distinguish payment types

### 2. **Sorting Capabilities**

- **By Date**: Most recent first (default) or oldest first
- **By Customer Name**: Alphabetical order (A-Z or Z-A)
- **By Amount**: Lowest to highest or highest to lowest
- **Visual Indicators**: Arrow icons show current sort direction

### 3. **Advanced Filtering**

- **Customer Name**: Search by partial customer name
- **Date Range**: Filter by specific date periods (YYYY-MM-DD format)
- **Amount Range**: Filter by minimum and maximum payment amounts
- **Quick Actions**: Clear all filters or apply current filter settings

### 4. **Detailed View Modal**

When a payment history item is clicked, users can view:

- **Customer Information**: Name and phone (if available)
- **Payment Details**: Amount, method, status, date, reference number
- **Sale Information**: For sale payments, shows total sale amount and remaining balance
- **Quick Navigation**: Direct link to view full sale details

### 5. **Read-Only Access**

- Salespersons can view all payment details but cannot delete or modify records
- This ensures data integrity while providing transparency
- All payment modifications must be done by administrators

## User Interface

### Payment History List

Each payment entry shows:

- Customer name with payment type tag (Payment/Sale Payment)
- Payment amount (prominently displayed)
- Payment method and timestamp
- Status badge with color coding:
  - Green: Completed/Paid
  - Orange: Pending/Partial
  - Red: Failed/Unpaid

### Filter Panel

- Collapsible filter section accessible via header button
- Side-by-side date range inputs
- Side-by-side amount range inputs
- Clear and Apply buttons for filter management

### Sort Controls

- Horizontal scrollable sort button row
- Active sort button highlighted in blue
- Arrow indicators for sort direction

## Navigation

The payment section now has two tabs:

1. **Summary**: Overview with payment statistics and summary cards
2. **History**: Detailed chronological list of all payments

## Data Sources

- **Payments API**: `/api/payments/` - Official payment records
- **Sales API**: `/api/sales/` - Sales with payment information
- **Combined Processing**: Frontend merges and sorts both data sources

## Status Color Coding

- **Payments**: Completed (green), Pending (orange), Failed (red)
- **Sales**: Paid (green), Partial (orange), Unpaid (red)

## Error Handling

- Empty state message when no payment history found
- Loading indicators during data fetch
- Error alerts for failed API requests
- Graceful handling of missing data fields
