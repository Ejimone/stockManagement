/**
 * Mock data for the app when the backend is not available
 */

export const mockDashboardStats = {
  // Admin dashboard stats
  admin: {
    total_sales_today: 5,
    total_revenue_today: 1250.75,
    total_sales_this_month: 42,
    total_revenue_this_month: 9876.5,
    total_products: 125,
    low_stock_products: 8,
    out_of_stock_products: 3,
    total_salespersons: 4,
    pending_payments: 1520.3,
  },

  // Salesperson dashboard stats
  salesperson: {
    my_sales_today: 2,
    my_revenue_today: 450.25,
    my_sales_this_month: 12,
    my_revenue_this_month: 3242.75,
    my_pending_sales: 1,
    my_pending_amount: 125.5,
  },
};

export const mockProducts = [
  {
    id: 1,
    name: "Laptop",
    description: "High performance laptop with 16GB RAM",
    price: 899.99,
    stock_quantity: 15,
    category: "Electronics",
  },
  {
    id: 2,
    name: "Office Desk",
    description: "Large wooden desk for home office",
    price: 249.99,
    stock_quantity: 8,
    category: "Furniture",
  },
  {
    id: 3,
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 29.99,
    stock_quantity: 45,
    category: "Electronics",
  },
  {
    id: 4,
    name: "Notebook Set",
    description: "Pack of 5 premium notebooks",
    price: 19.99,
    stock_quantity: 3,
    category: "Stationery",
  },
];

export const mockSales = [
  {
    id: 1,
    salesperson_name: "John Smith",
    total_amount: 929.98,
    payment_method: "Credit Card",
    payment_status: "Paid",
    amount_paid: 929.98,
    balance: 0,
    created_at: "2025-06-08T15:30:00Z",
  },
  {
    id: 2,
    salesperson_name: "Jane Doe",
    total_amount: 249.99,
    payment_method: "Cash",
    payment_status: "Paid",
    amount_paid: 249.99,
    balance: 0,
    created_at: "2025-06-08T16:45:00Z",
  },
  {
    id: 3,
    salesperson_name: "Michael Brown",
    total_amount: 570.95,
    payment_method: "Credit",
    payment_status: "Partial",
    amount_paid: 200,
    balance: 370.95,
    created_at: "2025-06-09T09:20:00Z",
  },
];

export default {
  dashboardStats: mockDashboardStats,
  products: mockProducts,
  sales: mockSales,
};
