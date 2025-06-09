import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as tokenStorage from "./tokenStorage";
import { User } from "../contexts/AuthContext"; // For User type
import { Platform } from "react-native";

// Use either localhost for development on same machine, or device's local IP address
// for testing on real devices, or your production backend URL
const API_BASE_URL = "http://10.0.2.2:8000/api/"; // For Android emulator (points to host machine's localhost)
// const API_BASE_URL = "http://localhost:8001/api/"; // For web/iOS simulator
// const API_BASE_URL = "http://<your-computer-ip>:8001/api/"; // Use your computer's IP when testing on real devices

// Error response type from backend (adjust if needed)
export interface ApiErrorResponse {
  detail?: string;
  [key: string]: any; // For other potential error fields
}

// Login API response structure
export interface LoginApiResponse {
  access: string;
  refresh: string;
  user: User;
}

// Generic type for paginated responses (if your backend uses this structure)
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Axios Client Setup with Interceptors ---
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add token to headers for non-auth requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authEndpoints = ["/auth/login/", "/auth/refresh/", "/auth/register/"];
    if (
      config.url &&
      authEndpoints.some((endpoint) => config.url!.endsWith(endpoint))
    ) {
      return config;
    }
    const { accessToken } = await tokenStorage.getToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401 errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers["Authorization"] = "Bearer " + token;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err); // Propagate the error after queue processing
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken } = await tokenStorage.getToken();
      if (!refreshToken) {
        console.error("No refresh token available.");
        await tokenStorage.removeToken();
        await tokenStorage.removeUser();
        isRefreshing = false;
        processQueue(new Error("No refresh token"), null);
        // Consider navigating to login via a global navigation utility or event
        return Promise.reject(
          new Error("No refresh token available. Please login.")
        );
      }

      try {
        const response = await axios.post<{ access: string; refresh?: string }>(
          `${API_BASE_URL}auth/refresh/`,
          { refresh: refreshToken }
        );
        const { access: newAccessToken, refresh: newRefreshToken } =
          response.data;

        await tokenStorage.saveToken(
          newAccessToken,
          newRefreshToken || refreshToken
        );

        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }
        // Update default header for subsequent requests from other parts of the app if needed
        // However, the request interceptor should handle adding the new token correctly.
        // apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        console.error("Refresh token failed", refreshError);
        await tokenStorage.removeToken();
        await tokenStorage.removeUser();
        processQueue(refreshError, null);
        // Consider navigating to login
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// --- Authentication & User Profile ---
/**
 * Logs in a user. Uses a direct axios call as it should not send existing auth token.
 */
export const loginUser = async (
  email_address: string,
  password_str: string
): Promise<LoginApiResponse> => {
  console.log(
    `Attempting to login with email: ${email_address} to URL: ${API_BASE_URL}auth/login/`
  );
  try {
    const response = await axios.post<LoginApiResponse>(
      `${API_BASE_URL}auth/login/`,
      {
        email: email_address,
        password: password_str,
      },
      {
        timeout: 10000, // 10 second timeout
      }
    );
    console.log("Login successful:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Login error details:", error.message, error.response?.data);
    throw error;
  }
};

/**
 * Fetches the current authenticated user's profile.
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>("/auth/me/");
  return response.data;
};

// --- User Management (Admin Only) ---
/**
 * Get a list of users.
 * @param params Optional query parameters (e.g., { role: 'Salesperson' })
 */
export const getUsers = async (params?: {
  role?: string;
}): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get<PaginatedResponse<User>>("/users/", {
    params,
  });
  return response.data;
};

/**
 * Create a new user.
 * @param userData Data for the new user.
 */
export const createUser = async (userData: object): Promise<User> => {
  const response = await apiClient.post<User>("/users/", userData);
  return response.data;
};

/**
 * Get details for a specific user.
 * @param userId ID of the user.
 */
export const getUserDetails = async (
  userId: string | number
): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${userId}/`);
  return response.data;
};

/**
 * Update an existing user.
 * @param userId ID of the user to update.
 * @param userData Data to update.
 */
export const updateUser = async (
  userId: string | number,
  userData: object
): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}/`, userData);
  return response.data;
};

/**
 * Delete a user.
 * @param userId ID of the user to delete.
 */
export const deleteUser = async (userId: string | number): Promise<void> => {
  await apiClient.delete(`/users/${userId}/`);
};

// --- Product Management ---
// Define Product type (adjust as per your backend)
export interface Product {
  id: string | number;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number | string; // Allow both number and string to handle API variations
  stock_quantity?: number;
  active?: boolean;
  is_active?: boolean; // Backend uses is_active
  stock_status?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get a list of products.
 * @param params Optional query parameters (e.g., { category: 'Electronics', stock_status: 'in_stock', search: 'laptop', active_only: true })
 */
export const getProducts = async (params?: {
  category?: string;
  stock_status?: string;
  search?: string;
  active_only?: boolean;
}): Promise<PaginatedResponse<Product>> => {
  const response = await apiClient.get<PaginatedResponse<Product>>(
    "/products/",
    { params }
  );
  return response.data;
};

/**
 * Create a new product (Admin only).
 * @param productData Data for the new product.
 */
export const createProduct = async (productData: object): Promise<Product> => {
  const response = await apiClient.post<Product>("/products/", productData);
  return response.data;
};

/**
 * Get details for a specific product.
 * @param productId ID of the product.
 */
export const getProductDetails = async (
  productId: string | number
): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${productId}/`);
  return response.data;
};

/**
 * Update an existing product (Admin only).
 * @param productId ID of the product to update.
 * @param productData Data to update.
 */
export const updateProduct = async (
  productId: string | number,
  productData: object
): Promise<Product> => {
  const response = await apiClient.put<Product>(
    `/products/${productId}/`,
    productData
  );
  return response.data;
};

/**
 * Delete a product (Admin only).
 * @param productId ID of the product to delete.
 */
export const deleteProduct = async (
  productId: string | number
): Promise<void> => {
  await apiClient.delete(`/products/${productId}/`);
};

// --- Sales Management ---
// Define Sale type (adjust as per your backend)
export interface Sale {
  id: string | number;
  salesperson?: string | number;
  salesperson_name?: string;
  customer_name?: string;
  customer_phone?: string;
  products_sold?: any[]; // Array of product details
  items?: SaleItem[]; // Sale items from backend
  total_amount?: number;
  payment_method?: string;
  payment_status?: string;
  amount_paid?: number;
  balance?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Define SaleItem type for detailed sale items
export interface SaleItem {
  id: string | number;
  product: string | number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  price_at_sale: number;
  subtotal: number;
}

/**
 * Get a list of sales.
 * @param params Optional query parameters (e.g., { date_from: '2023-01-01', payment_status: 'paid', salesperson: 1 })
 */
export const getSales = async (params?: {
  date_from?: string;
  date_to?: string;
  payment_status?: string;
  salesperson?: string | number;
}): Promise<PaginatedResponse<Sale>> => {
  const response = await apiClient.get<PaginatedResponse<Sale>>("/sales/", {
    params,
  });
  return response.data;
};

/**
 * Create a new sale.
 * @param saleData Data for the new sale.
 */
export const createSale = async (saleData: object): Promise<Sale> => {
  const response = await apiClient.post<Sale>("/sales/", saleData);
  return response.data;
};

/**
 * Get details for a specific sale.
 * @param saleId ID of the sale.
 */
export const getSaleDetails = async (
  saleId: string | number
): Promise<Sale> => {
  const response = await apiClient.get<Sale>(`/sales/${saleId}/`);
  return response.data;
};

/**
 * Update an existing sale (Admin only for certain fields).
 * @param saleId ID of the sale to update.
 * @param saleData Data to update.
 */
export const updateSale = async (
  saleId: string | number,
  saleData: object
): Promise<Sale> => {
  const response = await apiClient.patch<Sale>(`/sales/${saleId}/`, saleData); // Using PATCH for partial updates
  return response.data;
};

/**
 * Delete a sale (Admin only).
 * @param saleId ID of the sale to delete.
 */
export const deleteSale = async (saleId: string | number): Promise<void> => {
  await apiClient.delete(`/sales/${saleId}/`);
};

// --- Payment Management (Admin Only) ---
// Define Payment type (adjust as per your backend)
export interface Payment {
  id: string | number;
  sale_id?: string | number;
  amount?: number;
  payment_date?: string;
  payment_method?: string;
  status?: string;
  // Add other payment fields
}

/**
 * Get a list of payments.
 * @param params Optional query parameters (e.g., { sale: 1, status: 'completed' })
 */
export const getPayments = async (params?: {
  sale?: string | number;
  status?: string;
  date_from?: string;
  date_to?: string;
}): Promise<PaginatedResponse<Payment>> => {
  const response = await apiClient.get<PaginatedResponse<Payment>>(
    "/payments/",
    { params }
  );
  return response.data;
};

/**
 * Record a new payment.
 * @param paymentData Data for the new payment.
 */
export const recordPayment = async (paymentData: object): Promise<Payment> => {
  const response = await apiClient.post<Payment>("/payments/", paymentData);
  return response.data;
};

/**
 * Get details for a specific payment.
 * @param paymentId ID of the payment.
 */
export const getPaymentDetails = async (
  paymentId: string | number
): Promise<Payment> => {
  const response = await apiClient.get<Payment>(`/payments/${paymentId}/`);
  return response.data;
};

/**
 * Update an existing payment.
 * @param paymentId ID of the payment to update.
 * @param paymentData Data to update.
 */
export const updatePayment = async (
  paymentId: string | number,
  paymentData: object
): Promise<Payment> => {
  const response = await apiClient.patch<Payment>(
    `/payments/${paymentId}/`,
    paymentData
  ); // Using PATCH
  return response.data;
};

// Import mock data for fallback when backend is unavailable
import { mockDashboardStats } from "./mockData";

// --- Dashboard & Reporting ---
/**
 * Get dashboard statistics.
 * @param useFallback Whether to use fallback mock data if the API fails
 */
export const getDashboardStats = async (
  useFallback: boolean = true
): Promise<any> => {
  try {
    console.log("Fetching dashboard stats...");
    // Replace 'any' with specific DashboardStats type
    const response = await apiClient.get<any>("/dashboard/");
    console.log("Dashboard stats response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Dashboard stats error:", error.message);
    console.error("Full error:", error);

    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }

    if (useFallback) {
      console.warn("Using mock dashboard data as fallback");

      // Try to determine the user role
      try {
        // Use stored user in token storage instead of direct import to avoid circular dependency
        const storedUser = await tokenStorage.getUser();
        const role = (storedUser as any)?.role || "Salesperson";

        console.log("Using fallback data for role:", role);
        // Return appropriate mock data based on user role
        return role === "Admin"
          ? mockDashboardStats.admin
          : mockDashboardStats.salesperson;
      } catch (e) {
        console.error("Error getting user role for fallback data:", e);
        // Default to Salesperson mock data if role can't be determined
        return mockDashboardStats.salesperson;
      }
    }

    throw error;
  }
};

/**
 * Get sales report.
 * @param params Optional query parameters for filtering the report.
 */
export const getSalesReport = async (params?: {
  date_from?: string;
  date_to?: string;
  salesperson?: string | number;
  payment_status?: string;
}): Promise<any> => {
  // Replace 'any' with specific SalesReport type
  const response = await apiClient.get<any>("/reports/sales/", { params });
  return response.data;
};

/**
 * Get inventory report (Admin only).
 * @param params Optional query parameters for filtering the report.
 */
export const getInventoryReport = async (params?: {
  category?: string;
  stock_status?: string;
  active_only?: boolean;
}): Promise<any> => {
  // Replace 'any' with specific InventoryReport type
  const response = await apiClient.get<any>("/reports/inventory/", { params });
  return response.data;
};

// --- PDF Receipt Functions ---
/**
 * Generate and download PDF receipt for a sale
 */
export const getSalePdfReceipt = async (
  saleId: string | number
): Promise<Blob> => {
  const response = await apiClient.get(`/sales/${saleId}/pdf/`, {
    responseType: "blob", // Important: tells axios to expect binary data
  });
  return response.data;
};

/**
 * Generate PDF receipt URL for a sale
 */
export const getSalePdfReceiptUrl = (saleId: string | number): string => {
  return `${API_BASE_URL}sales/${saleId}/pdf/`;
};

/**
 * Display PDF receipt in a shareable format for React Native
 */
export const displayPdfReceipt = async (
  saleId: string | number
): Promise<void> => {
  try {
    // Get the authenticated URL
    const pdfUrl = getSalePdfReceiptUrl(saleId);

    // For React Native, we'll need to show this URL in a way that includes authentication
    // The simplest approach is to use the device's browser with a message to the user
    const { Alert, Linking } = await import("react-native");

    Alert.alert(
      "PDF Receipt",
      "Your receipt will open in the browser. You may need to log in to view it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Receipt",
          onPress: async () => {
            try {
              const canOpen = await Linking.canOpenURL(pdfUrl);
              if (canOpen) {
                await Linking.openURL(pdfUrl);
              } else {
                Alert.alert("Error", "Cannot open PDF viewer on this device");
              }
            } catch (error) {
              console.error("Failed to open URL:", error);
              Alert.alert("Error", "Failed to open receipt");
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error("Failed to display PDF receipt:", error);
    const { Alert } = await import("react-native");
    Alert.alert("Error", "Could not generate PDF receipt");
  }
};

// Export the configured apiClient if other parts of the app need to make calls with it directly
// though it's generally better to use the exported functions.
export default apiClient;
