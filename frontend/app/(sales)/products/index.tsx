import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts, Product } from "../../../services/api";
import { formatCurrency } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function SalesProductListScreen() {
  const { user, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchBarPosition = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Keyboard listeners for smooth animation
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);

        // Animate search bar up when keyboard appears
        Animated.timing(searchBarPosition, {
          toValue: -keyboardHeight + (Platform.OS === "ios" ? 34 : 0), // Account for safe area on iOS
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);

        // Animate search bar back to bottom
        Animated.timing(searchBarPosition, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [searchBarPosition]);

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
      <View style={styles.productHeader}>
        <View style={styles.productMainInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>SKU: {item.sku || "N/A"}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}

      <View style={styles.productFooter}>
        <View style={styles.stockInfo}>
          <Text style={styles.stockLabel}>Stock: </Text>
          <Text style={styles.stockQuantity}>
            {item.stock_quantity ?? "N/A"}
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
            size={16}
            color={item.stock_quantity === 0 ? "#9ca3af" : "#ffffff"}
          />
          <Text
            style={[
              styles.makeSaleButtonText,
              item.stock_quantity === 0 && styles.makeSaleButtonTextDisabled,
            ]}
          >
            {item.stock_quantity === 0 ? "Out" : "Sell"}
          </Text>
        </TouchableOpacity>
      </View>

      {item.category && (
        <Text style={styles.productCategory}>{item.category}</Text>
      )}
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
        contentContainerStyle={[
          products.length === 0 ? styles.emptyListContainer : undefined,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 100 }, // Dynamic padding for floating bar
        ]}
      />

      {/* Floating Bottom Bar with Search and Add Product Button */}
      <Animated.View
        style={[
          styles.floatingBar,
          {
            transform: [{ translateY: searchBarPosition }],
          },
        ]}
      >
        <View style={styles.searchContainerFloating}>
          <TextInput
            style={styles.searchInputFloating}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={styles.addFloatingButton}
          onPress={() => router.push("/(sales)/products/create")}
          activeOpacity={0.8}
        >
          <Text style={styles.addFloatingButtonText}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 80, // Increased top margin for better spacing
  },
  floatingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 12, // Account for safe area on iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 8,
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  searchContainerFloating: {
    flex: 1,
    marginRight: 12,
  },
  searchInputFloating: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addFloatingButton: {
    backgroundColor: "#10b981",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addFloatingButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
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
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.84,
    elevation: 3,
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stockLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  stockQuantity: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "600",
    marginRight: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  productSku: {
    fontSize: 13,
    color: "#9ca3af",
    fontWeight: "500",
  },
  productDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
  },
  productCategory: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
  },
  stockStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stockStatusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
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
  makeSaleButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: 80,
  },
  makeSaleButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  makeSaleButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  makeSaleButtonTextDisabled: {
    color: "#9ca3af",
  },
});
