import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import * as tokenStorage from "./tokenStorage";
import { User } from "../contexts/AuthContext"; // For User type
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

// Platform-specific FileSystem check
if (Platform.OS !== "web" && !FileSystem.downloadAsync) {
  console.warn("FileSystem.downloadAsync is not available on this platform");
}

// Dynamic API URL detection for different platforms and environments
const getInitialApiBaseUrl = (): string => {
  // ngrok URL - CURRENT ACTIVE TUNNEL (ngrok-only configuration)
  // This works everywhere: emulator, physical devices, web, anywhere with internet!
  const ngrokUrl = "https://67d0-59-145-142-18.ngrok-free.app/api/";

  console.log("🌐 Using ngrok-only configuration:", ngrokUrl);
  return ngrokUrl;
};

// Use a proper initial API URL
const API_BASE_URL = getInitialApiBaseUrl();

// Smart API URL detection - ngrok-only configuration
const detectWorkingApiUrl = async (): Promise<string> => {
  // NGROK-ONLY: Use current active ngrok tunnel exclusively
  const ngrokUrl = "https://67d0-59-145-142-18.ngrok-free.app/api/";

  console.log("🔍 Testing ngrok-only configuration...");
  console.log("📱 Platform:", Platform.OS);
  console.log(`🌐 ngrok URL: ${ngrokUrl}`);

  try {
    console.log(`Testing API endpoint: ${ngrokUrl}`);
    const response = await axios.get(ngrokUrl, {
      timeout: 10000, // Longer timeout for ngrok
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 && response.data) {
      console.log(`✅ ngrok connection successful: ${ngrokUrl}`);
      console.log(`📊 API Response:`, response.data);
      return ngrokUrl;
    } else {
      console.log(`⚠️ ngrok URL responded with status ${response.status}`);
      throw new Error(`ngrok URL returned status ${response.status}`);
    }
  } catch (error: any) {
    let errorMsg = error.message;
    if (axios.isAxiosError(error)) {
      if (error.code === "ECONNABORTED") {
        errorMsg = "Timeout";
      } else if (error.response) {
        errorMsg = `Status ${error.response.status}`;
      } else if (error.request) {
        errorMsg = "No response/Network Error";
      }
    }
    console.log(`❌ ngrok connection failed: ${ngrokUrl} - ${errorMsg}`);

    // Since we're ngrok-only, throw error instead of falling back
    throw new Error(
      `ngrok connection failed: ${errorMsg}. Please check your ngrok tunnel is running.`
    );
  }
};

// Store the detected URL
let detectedApiUrl: string | null = null;

// Function to get the current API URL (detected or default)
const getCurrentApiUrl = async (): Promise<string> => {
  if (!detectedApiUrl) {
    detectedApiUrl = await detectWorkingApiUrl();
    console.log(`🔌 Using API URL: ${detectedApiUrl}`);
  }
  return detectedApiUrl;
};

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
  // baseURL will be set dynamically by the request interceptor
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second default timeout
});

// Request Interceptor: Add token to headers and set dynamic baseURL
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Set the dynamic baseURL for each request
    if (!config.baseURL) {
      config.baseURL = await getCurrentApiUrl();
    }

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
  // Get the dynamic API URL before making the login request
  const apiUrl = await getCurrentApiUrl();
  console.log(
    `Attempting to login with email: ${email_address} to URL: ${apiUrl}auth/login/`
  );
  try {
    const response = await axios.post<LoginApiResponse>(
      `${apiUrl}auth/login/`,
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
 * Update a sale's payment status to 'paid' (Salesperson can update own sales, Admin can update any).
 * @param saleId ID of the sale to update.
 */
export const updateSalePaymentStatus = async (
  saleId: string | number
): Promise<{ message: string; sale: Sale }> => {
  const response = await apiClient.patch<{ message: string; sale: Sale }>(
    `/sales/${saleId}/payment-status/`,
    { payment_status: "paid" }
  );
  return response.data;
};

/**
 * Delete a sale (Admin only).
 * @param saleId ID of the sale to delete.
 */
export const deleteSale = async (saleId: string | number): Promise<void> => {
  await apiClient.delete(`/sales/${saleId}/`);
};

// --- Payment Management ---
// Enhanced Payment type based on backend PaymentSerializer
export interface Payment {
  id: string | number;
  sale: number;
  sale_customer?: string;
  sale_customer_phone?: string;
  sale_total_amount?: number;
  sale_balance?: number;
  sale_payment_status?: string;
  sale_created_at?: string;
  salesperson_name?: string;
  sale_items_summary?: Array<{
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  amount: number;
  payment_method: string;
  reference_number?: string;
  status: string;
  recorded_by?: number;
  recorded_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface PaymentSummary {
  total_payments: number;
  total_credits: number;
  total_partial_debts: number;
  credits_over_1000: number;
  completed_payments_count: number;
  pending_payments_count: number;
  credit_sales_count: number;
  partial_payments_count: number;
  customers_with_debt: Array<{
    customer_name: string;
    customer_phone?: string;
    total_debt: number;
    sales_count: number;
  }>;
  recent_payments: Array<{
    id: number;
    amount: number;
    customer_name?: string;
    payment_method: string;
    created_at: string;
    recorded_by: string;
  }>;
}

export interface PaymentFilters {
  sale?: string | number;
  customer_name?: string;
  customer_phone?: string;
  status?: string;
  payment_method?: string;
  sale_payment_status?: string;
  date_from?: string;
  date_to?: string;
  time_from?: string;
  time_to?: string;
}

/**
 * Get a list of payments with comprehensive filtering.
 */
export const getPayments = async (
  filters?: PaymentFilters
): Promise<PaginatedResponse<Payment>> => {
  const response = await apiClient.get<PaginatedResponse<Payment>>(
    "/payments/",
    { params: filters }
  );
  return response.data;
};

/**
 * Get payment summary statistics.
 */
export const getPaymentSummary = async (filters?: {
  date_from?: string;
  date_to?: string;
}): Promise<PaymentSummary> => {
  const response = await apiClient.get<PaymentSummary>("/payments/summary/", {
    params: filters,
  });
  return response.data;
};

/**
 * Record a new payment (Admin only).
 */
export const recordPayment = async (paymentData: {
  sale: number;
  amount: number;
  payment_method: string;
  reference_number?: string;
  status?: string;
  notes?: string;
}): Promise<Payment> => {
  const response = await apiClient.post<Payment>("/payments/", paymentData);
  return response.data;
};

/**
 * Get details for a specific payment.
 */
export const getPaymentDetails = async (
  paymentId: string | number
): Promise<Payment> => {
  const response = await apiClient.get<Payment>(`/payments/${paymentId}/`);
  return response.data;
};

/**
 * Update an existing payment (Admin only).
 */
export const updatePayment = async (
  paymentId: string | number,
  paymentData: Partial<{
    amount: number;
    payment_method: string;
    reference_number: string;
    status: string;
    notes: string;
  }>
): Promise<Payment> => {
  const response = await apiClient.patch<Payment>(
    `/payments/${paymentId}/`,
    paymentData
  );
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
    console.log("📊 Fetching dashboard stats...");
    console.log("📡 API Base URL:", API_BASE_URL);

    // Validate network connection first
    const isConnected = await validateNetworkConnection();
    if (!isConnected) {
      throw new Error("Network connection validation failed");
    }

    // Use retry logic for the dashboard request
    const response = await retryWithBackoff(async () => {
      console.log("🔄 Making dashboard API request...");
      return await apiClient.get<any>("/dashboard/");
    });

    console.log("✅ Dashboard stats response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Dashboard stats error:", error.message);
    console.error("🔍 Full error:", error);

    if (error.response) {
      console.error("📄 Response data:", error.response.data);
      console.error("📊 Response status:", error.response.status);
    }

    if (useFallback) {
      console.warn("🔄 Using mock dashboard data as fallback");

      // Try to determine the user role
      try {
        // Use stored user in token storage instead of direct import to avoid circular dependency
        const storedUser = await tokenStorage.getUser();
        const role = (storedUser as any)?.role || "Salesperson";

        console.log("👤 Using fallback data for role:", role);
        // Return appropriate mock data based on user role
        return role === "Admin"
          ? mockDashboardStats.admin
          : mockDashboardStats.salesperson;
      } catch (e) {
        console.error("❌ Error getting user role for fallback data:", e);
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

/**
 * Get comprehensive reports with chart data.
 * @param params Optional query parameters for filtering the report.
 */
export const getComprehensiveReports = async (params?: {
  date_from?: string;
  date_to?: string;
}): Promise<any> => {
  const response = await apiClient.get<any>("/reports/comprehensive/", {
    params,
  });
  return response.data;
};

// --- PDF Receipt Functions ---
/**
 * Create a PDF access token for a sale (authenticated)
 */
export const createPdfToken = async (
  saleId: string | number
): Promise<{ token: string; expires_at: string; download_url: string }> => {
  const response = await apiClient.post(`/sales/${saleId}/pdf-token/`);
  return response.data;
};

/**
 * Download and save PDF receipt directly to device storage
 */
export const downloadAndSavePdfReceipt = async (
  saleId: string | number
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  try {
    console.log("Starting PDF receipt download for sale:", saleId);

    // Web platform fallback
    if (Platform.OS === "web") {
      console.log("Web platform detected, using browser download");
      try {
        const tokenData = await createPdfToken(saleId);
        const downloadUrl = `${API_BASE_URL.replace("/api/", "")}${
          tokenData.download_url
        }`;

        // For web, open the PDF in a new tab
        if (typeof window !== "undefined") {
          window.open(downloadUrl, "_blank");
        } else {
          throw new Error("Window object not available");
        }

        return {
          success: true,
          filePath: downloadUrl,
        };
      } catch (webError) {
        console.error("Web download failed:", webError);
        return {
          success: false,
          error:
            "Failed to open PDF in browser: " +
            (webError instanceof Error ? webError.message : "Unknown error"),
        };
      }
    }

    // Check if FileSystem.downloadAsync is available
    if (!FileSystem.downloadAsync) {
      throw new Error(
        "FileSystem.downloadAsync is not available on this platform. Please check if expo-file-system is properly installed."
      );
    }

    // First, create a PDF token
    const tokenData = await createPdfToken(saleId);
    console.log(
      "PDF token created successfully:",
      tokenData.token.substring(0, 8) + "..."
    );

    // Check if FileSystem is available
    if (!FileSystem.documentDirectory) {
      throw new Error("FileSystem.documentDirectory is not available");
    }

    // Build the download URL (no authentication needed)
    const downloadUrl = `${API_BASE_URL.replace("/api/", "")}${
      tokenData.download_url
    }`;

    // Generate filename
    const fileName = `receipt_sale_${saleId}_${Date.now()}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    console.log("Downloading PDF from:", downloadUrl);
    console.log("Saving to:", fileUri);

    // Download the file
    const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);
    console.log("Download result:", downloadResult);

    if (downloadResult.status === 200) {
      console.log("PDF downloaded successfully to:", downloadResult.uri);

      // Check if sharing is available and share the file
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        console.log("Sharing available:", isAvailable);

        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: "application/pdf",
            dialogTitle: "Save Receipt",
            UTI: "com.adobe.pdf",
          });
          console.log("File shared successfully");
        } else {
          console.log("Sharing not available on this platform");
        }
      } catch (sharingError) {
        console.error(
          "Failed to share file, but download succeeded:",
          sharingError
        );
        // Don't fail the entire operation if sharing fails
      }

      return {
        success: true,
        filePath: downloadResult.uri,
      };
    } else {
      console.error("Download failed with status:", downloadResult.status);
      return {
        success: false,
        error: `Download failed with status: ${downloadResult.status}`,
      };
    }
  } catch (error) {
    console.error("Failed to download PDF receipt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

/**
 * Generate and download PDF receipt for a sale (legacy method)
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
 * Generate PDF receipt URL for a sale (legacy method)
 */
export const getSalePdfReceiptUrl = (saleId: string | number): string => {
  return `${API_BASE_URL}sales/${saleId}/pdf/`;
};

/**
 * Display PDF receipt with download option
 */
export const displayPdfReceipt = async (
  saleId: string | number
): Promise<void> => {
  try {
    const { Alert } = await import("react-native");

    Alert.alert(
      "PDF Receipt",
      "Would you like to download the receipt to your device?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: async () => {
            const result = await downloadAndSavePdfReceipt(saleId);
            if (result.success) {
              Alert.alert(
                "Success",
                "Receipt downloaded and saved successfully!"
              );
            } else {
              Alert.alert(
                "Error",
                result.error || "Failed to download receipt"
              );
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

// Enhanced network debugging and retry logic
const validateNetworkConnection = async (): Promise<boolean> => {
  try {
    console.log("🔍 Validating network connection...");

    // Get the current API URL (detected or default)
    const currentApiUrl = await getCurrentApiUrl();
    console.log("Testing API endpoint:", currentApiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Test the actual API endpoint that should return 200
    const response = await fetch(currentApiUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      console.log("✅ Network connection validated");
      try {
        const data = await response.json();
        console.log("📊 API root response:", data);
      } catch (e) {
        console.log("📊 API responded but couldn't parse JSON");
      }
      return true;
    } else {
      console.log("❌ Network validation failed with status:", response.status);
      return false;
    }
  } catch (error: any) {
    console.log("❌ Network validation error:", error.message);
    return false;
  }
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.log(`❌ Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};

// Export the configured apiClient if other parts of the app need to make calls with it directly
// though it's generally better to use the exported functions.
export default apiClient;
