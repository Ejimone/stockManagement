import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
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

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState<string | number | null>(
    null
  );

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sales Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(admin)/sales/create")}
        >
          <Text style={styles.addButtonText}>+ New Sale</Text>
        </TouchableOpacity>
      </View>

      {/* Sales List */}
      <FlatList
        data={sales}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSaleItem}
        contentContainerStyle={[
          styles.listContainer,
          sales.length === 0 ? styles.emptyListContainer : null,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No sales found.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50, // Added top margin for header-less pages
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
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
