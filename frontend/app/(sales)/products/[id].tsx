import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProductDetails, getProducts, Product } from "../../../services/api";
import { formatCurrency } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function SalesProductDetailScreen() {
  const { id, sku, preselectedSku } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && id !== "search" && id !== "by-sku") {
      // Only fetch by ID if it's a valid product ID
      fetchProductDetails();
    } else if (sku || preselectedSku) {
      // If we have SKU, find the product by SKU
      fetchProductBySku((sku as string) || (preselectedSku as string));
    }
  }, [id, sku, preselectedSku]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const productData = await getProductDetails(id as string);
      setProduct(productData);
    } catch (err: any) {
      console.error("Failed to fetch product details:", err);
      setError(err.message || "Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };
  const fetchProductBySku = async (productSku: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use the search parameter in the products API to find by SKU
      const response = await getProducts({ search: productSku });
      const products = response.results || response;

      // Find exact match by SKU
      const foundProduct = products.find((p: Product) => p.sku === productSku);

      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError(`Product not found with SKU: ${productSku}`);
      }
    } catch (err: any) {
      console.error("Failed to fetch product by SKU:", err);
      setError(err.message || "Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSale = () => {
    if (product) {
      router.push({
        pathname: "/(sales)/sales/create",
        params: {
          preselectedSku: product.sku,
          preselectedName: product.name,
        },
      });
    }
  };

  const getStockStatusColor = (stock: number | undefined) => {
    const stockValue = stock || 0;
    if (stockValue <= 0) return "#ef4444";
    if (stockValue <= 10) return "#f59e0b";
    return "#22c55e";
  };

  const getStockStatusText = (stock: number | undefined) => {
    const stockValue = stock || 0;
    if (stockValue <= 0) return "Out of Stock";
    if (stockValue <= 10) return "Low Stock";
    return "In Stock";
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error || "Product not found"}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchProductDetails()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          headerTitleStyle: { fontSize: 16 },
        }}
      />

      {/* Product Header */}
      <View style={styles.headerContainer}>
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productSku}>SKU: {product.sku}</Text>
          <Text style={styles.productCategory}>{product.category}</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: getStockStatusColor(product.stock_quantity) },
            ]}
          >
            <Text style={styles.stockBadgeText}>
              {getStockStatusText(product.stock_quantity)}
            </Text>
          </View>
        </View>
      </View>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Product Information</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailValue}>
            {product.description || "No description available"}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Stock:</Text>
          <Text
            style={[
              styles.detailValue,
              { color: getStockStatusColor(product.stock_quantity) },
            ]}
          >
            {product.stock_quantity || 0} units
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price per Unit:</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(product.price)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Category:</Text>
          <Text style={styles.detailValue}>
            {product.category || "Uncategorized"}
          </Text>
        </View>

        {product.created_at && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Added:</Text>
            <Text style={styles.detailValue}>
              {new Date(product.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.createSaleButton,
            (product.stock_quantity || 0) <= 0 && styles.disabledButton,
          ]}
          onPress={handleCreateSale}
          disabled={(product.stock_quantity || 0) <= 0}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle"
            size={20}
            color={(product.stock_quantity || 0) <= 0 ? "#9ca3af" : "#ffffff"}
          />
          <Text
            style={[
              styles.createSaleButtonText,
              (product.stock_quantity || 0) <= 0 && styles.disabledButtonText,
            ]}
          >
            Create Sale with This Product
          </Text>
        </TouchableOpacity>

        {(product.stock_quantity || 0) <= 0 && (
          <View style={styles.outOfStockNotice}>
            <Ionicons name="warning" size={16} color="#ef4444" />
            <Text style={styles.outOfStockText}>
              This product is currently out of stock and cannot be sold
            </Text>
          </View>
        )}
      </View>

      {/* Sales Information */}
      <View style={styles.salesInfoContainer}>
        <Text style={styles.sectionTitle}>Sales Information</Text>
        <Text style={styles.salesInfoText}>
          This product is available for sale to customers.
          {(product.stock_quantity || 0) > 0
            ? ` Currently ${product.stock_quantity || 0} units in stock.`
            : " Currently out of stock."}
        </Text>

        {(product.stock_quantity || 0) <= 10 &&
          (product.stock_quantity || 0) > 0 && (
            <View style={styles.lowStockWarning}>
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text style={styles.lowStockText}>
                Low stock alert: Only {product.stock_quantity || 0} units
                remaining
              </Text>
            </View>
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: 50, // Added top margin for header-less pages
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
    marginVertical: 16,
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
  headerContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  productSku: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#059669",
    marginBottom: 8,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  detailsContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    flex: 1,
  },
  actionsContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
  },
  createSaleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  createSaleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: "#e5e7eb",
  },
  disabledButtonText: {
    color: "#9ca3af",
  },
  outOfStockNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  outOfStockText: {
    fontSize: 14,
    color: "#dc2626",
    marginLeft: 8,
    flex: 1,
  },
  salesInfoContainer: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 16,
  },
  salesInfoText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 12,
  },
  lowStockWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  lowStockText: {
    fontSize: 14,
    color: "#d97706",
    marginLeft: 8,
    flex: 1,
  },
});
