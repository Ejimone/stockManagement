import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { getSales, deleteSale, Sale } from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { formatPrice } from "../../../utils/formatters";

interface PaginatedSalesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Sale[];
}

export default function AdminSalesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchBarPosition = useRef(new Animated.Value(0)).current;

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | number | null>(
    null
  );

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

  const fetchSales = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setError(null);
      }

      const response = (await getSales()) as PaginatedSalesResponse;
      setSales(response.results || response);
    } catch (err: any) {
      console.error("Failed to fetch sales:", err);
      setError(err.message || "Failed to fetch sales");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Refresh sales list when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSales(true);
    }, [fetchSales])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSales(true);
  };

  const handleDeleteSale = (saleId: string | number, saleInfo: string) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete sale ${saleInfo}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingSaleId(saleId);
            try {
              await deleteSale(saleId);
              // Optimistically remove sale from local state
              setSales((prevSales) =>
                prevSales.filter((sale) => sale.id !== saleId)
              );
              Alert.alert("Success", "Sale deleted successfully.");
            } catch (err: any) {
              console.error("Delete sale error:", err);
              Alert.alert(
                "Error",
                err.response?.data?.detail ||
                  err.message ||
                  "Failed to delete sale."
              );
              // Refresh the list to ensure consistency
              fetchSales(true);
            } finally {
              setDeletingSaleId(null);
            }
          },
        },
      ]
    );
  };

  // Filter sales based on search query
  const filteredSales = sales.filter((sale) =>
    searchQuery
      ? sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.salesperson_name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        sale.id.toString().includes(searchQuery) ||
        sale.payment_method
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        sale.payment_status?.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  const renderSaleItem = ({ item }: { item: Sale }) => {
    const saleDate = item.created_at
      ? new Date(item.created_at).toLocaleDateString()
      : "N/A";
    const saleTime = item.created_at
      ? new Date(item.created_at).toLocaleTimeString()
      : "";

    return (
      <View
        style={[
          styles.saleItemContainer,
          deletingSaleId === item.id && styles.deletingSale,
        ]}
      >
        <View style={styles.saleInfo}>
          <Text style={styles.saleId}>Sale #{item.id}</Text>
          <Text style={styles.customerName}>
            Customer: {item.customer_name || "Walk-in Customer"}
          </Text>
          <Text style={styles.salesperson}>
            Salesperson: {item.salesperson_name}
          </Text>
          <Text style={styles.saleAmount}>
            Total: {formatPrice(item.total_amount)}
          </Text>
          <Text style={styles.paymentStatus}>
            Payment: {item.payment_status} ({item.payment_method})
          </Text>
          <Text style={styles.saleDate}>
            {saleDate} {saleTime}
          </Text>
        </View>
        <View style={styles.saleActions}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.viewButton,
              deletingSaleId === item.id && styles.disabledButton,
            ]}
            onPress={() => router.push(`/(admin)/sales/${item.id}`)}
            disabled={deletingSaleId === item.id}
          >
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          {user?.role === "Admin" &&
            (deletingSaleId === item.id ? (
              <View style={[styles.actionButton, styles.deleteButton]}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() =>
                  handleDeleteSale(
                    item.id,
                    `#${item.id} (${formatPrice(item.total_amount)})`
                  )
                }
              >
                <Text style={styles.actionButtonText}>Delete</Text>
              </TouchableOpacity>
            ))}
        </View>
      </View>
    );
  };

  if (isLoading && sales.length === 0 && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }

  if (error && sales.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchSales(true)}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sales List */}
      <FlatList
        data={filteredSales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleItem}
        contentContainerStyle={[
          styles.listContainer,
          filteredSales.length === 0 ? styles.emptyListContainer : null,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 100 }, // Dynamic padding for floating bar
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No sales found matching your search."
                : "No sales found."}
            </Text>
          </View>
        }
      />

      {/* Floating Bottom Bar with Search and New Sale Button */}
      <Animated.View
        style={[
          styles.floatingBar,
          {
            transform: [{ translateY: searchBarPosition }],
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search sales by customer, ID, payment..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </View>
        <TouchableOpacity
          style={styles.addFloatingButton}
          onPress={() => router.push("/(admin)/sales/create")}
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
    backgroundColor: "#f5f5f5",
    paddingTop: 80, // Increased top margin for better spacing
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
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
  searchContainer: {
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  addFloatingButton: {
    backgroundColor: "#007AFF",
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
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
  },
  saleItemContainer: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deletingSale: {
    opacity: 0.6,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  salesperson: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 2,
  },
  paymentStatus: {
    fontSize: 14,
    color: "#888888",
    marginBottom: 2,
  },
  saleDate: {
    fontSize: 12,
    color: "#999999",
  },
  saleActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: "center",
  },
  viewButton: {
    backgroundColor: "#007AFF",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#888888",
    textAlign: "center",
  },
});
