import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts, Product } from "../../../services/api";
import { formatCurrency } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function SalesProductListScreen() {
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Debug: Check authentication status
  useEffect(() => {
    console.log("Auth Status:", {
      isAuthenticated,
      user: user?.email,
      role: user?.role,
      hasToken: !!token,
    });
  }, [isAuthenticated, user, token]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProductsData(true);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchProductsData = useCallback(
    async (resetPage = false) => {
      if (!resetPage) setIsLoading(true);
      else if (!refreshing) setIsLoading(true);

      setError(null);
      try {
        console.log("Fetching products for salesperson...");
        const params: any = { search: searchQuery };
        console.log("API params:", params);
        const response = await getProducts(params);
        console.log("Products response:", response);
        setProducts(response.results || []);
      } catch (err: any) {
        console.error("Failed to fetch products:", err);
        console.error("Error details:", err.response?.data);
        console.error("Error status:", err.response?.status);

        let errorMessage = "Failed to fetch products.";
        if (err.response?.status === 401) {
          errorMessage = "Authentication required. Please log in again.";
        } else if (err.response?.status === 403) {
          errorMessage =
            "Access denied. You don't have permission to view products.";
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        }

        setError(errorMessage);
        if (resetPage) setProducts([]);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [searchQuery, refreshing]
  );

  useEffect(() => {
    fetchProductsData(true);
  }, []);

  // Refresh products when screen comes into focus (e.g., returning from create page)
  useFocusEffect(
    useCallback(() => {
      fetchProductsData(true);
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProductsData(true);
  };

  const getStockStatusColor = (stockQuantity: number) => {
    if (stockQuantity === 0) return "#ef4444"; // Red for out of stock
    if (stockQuantity <= 10) return "#f59e0b"; // Orange for low stock
    return "#22c55e"; // Green for in stock
  };

  const getStockStatusText = (stockQuantity: number) => {
    if (stockQuantity === 0) return "Out of Stock";
    if (stockQuantity <= 10) return "Low Stock";
    return "In Stock";
  };

  const handleMakeSale = (product: Product) => {
    if (product.stock_quantity === 0) {
      Alert.alert(
        "Out of Stock",
        "This product is currently out of stock and cannot be sold.",
        [{ text: "OK" }]
      );
      return;
    }

    // Navigate to the create sale page with the selected product
    router.push({
      pathname: "/(sales)/sales/create",
      params: {
        preselectedProductId: product.id.toString(),
        preselectedProductName: product.name,
      },
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItemContainer}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku || "N/A"}</Text>
        <Text style={styles.productDescription}>
          {item.description || "No description available"}
        </Text>
        <Text style={styles.productPrice}>
          Price: {formatCurrency(item.price)}
        </Text>
        <View style={styles.stockContainer}>
          <Text style={styles.productStock}>
            Stock: {item.stock_quantity ?? "N/A"}
          </Text>
          <View
            style={[
              styles.stockStatusBadge,
              {
                backgroundColor: getStockStatusColor(item.stock_quantity || 0),
              },
            ]}
          >
            <Text style={styles.stockStatusText}>
              {getStockStatusText(item.stock_quantity || 0)}
            </Text>
          </View>
        </View>
        {item.category && (
          <Text style={styles.productCategory}>Category: {item.category}</Text>
        )}
      </View>

      {/* Make Sale Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.makeSaleButton,
            item.stock_quantity === 0 && styles.makeSaleButtonDisabled,
          ]}
          onPress={() => handleMakeSale(item)}
          disabled={item.stock_quantity === 0}
        >
          <Ionicons
            name={item.stock_quantity === 0 ? "ban-outline" : "cart-outline"}
            size={18}
            color={item.stock_quantity === 0 ? "#d1d5db" : "#ffffff"}
            style={styles.buttonIcon}
          />
          <Text
            style={[
              styles.makeSaleButtonText,
              item.stock_quantity === 0 && styles.makeSaleButtonTextDisabled,
            ]}
          >
            {item.stock_quantity === 0 ? "Out of Stock" : "Make Sale"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No products found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery ? "Try adjusting your search" : "No products available"}
      </Text>

      {/* Debug button for testing API connection */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => {
          Alert.alert(
            "Debug Info",
            `Auth: ${isAuthenticated}\nUser: ${user?.email}\nRole: ${
              user?.role
            }\nToken: ${token ? "Present" : "Missing"}`,
            [
              { text: "Test API", onPress: () => fetchProductsData(true) },
              { text: "OK" },
            ]
          );
        }}
      >
        <Text style={styles.debugButtonText}>Debug Connection</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && products.length === 0 && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "View Products" }} />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error && products.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: "View Products" }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProductsData(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "View Products" }} />

      {/* Add Product Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.addProductButton}
          onPress={() => router.push("/(sales)/products/create")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle"
            size={20}
            color="#ffffff"
            style={styles.buttonIcon}
          />
          <Text style={styles.addProductButtonText}>Add New Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          products.length === 0 ? styles.emptyListContainer : undefined
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
  },
  productList: {
    flex: 1,
  },
  productItemContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  productSku: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginBottom: 8,
  },
  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  productStock: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  stockStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  productCategory: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  debugButton: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 16,
  },
  debugButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  makeSaleButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  makeSaleButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  buttonIcon: {
    marginRight: 8,
  },
  makeSaleButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  makeSaleButtonTextDisabled: {
    color: "#d1d5db",
  },
  headerContainer: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  addProductButton: {
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addProductButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
