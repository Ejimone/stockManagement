import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { Stack, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSales, Sale } from "../../../services/api";
import { formatCurrency } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function SalesMySalesScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

  // Fetch sales when screen loads or comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [dateFilter])
  );

  const fetchSales = async (resetPage = false) => {
    try {
      if (!resetPage) setIsLoading(true);
      else if (!refreshing) setIsLoading(true);

      setError(null);

      // Prepare date filters
      let dateParams: { date_from?: string; date_to?: string } = {};
      const now = new Date();

      if (dateFilter === "today") {
        const today = now.toISOString().split("T")[0];
        dateParams = { date_from: today, date_to: today };
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateParams = { date_from: weekAgo.toISOString().split("T")[0] };
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateParams = { date_from: monthAgo.toISOString().split("T")[0] };
      }

      // For salespersons, filter by their own sales
      const params =
        user?.role === "Salesperson"
          ? { ...dateParams, salesperson: user.id }
          : dateParams;

      const response = await getSales(params);
      setSales(response.results || response);
    } catch (err: any) {
      console.error("Failed to fetch sales:", err);
      setError("Failed to load sales. Please try again.");
    } finally {
      setIsLoading(false);
      if (resetPage) setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales(true);
  };

  const handleSalePress = (sale: Sale) => {
    router.push({
      pathname: `/(sales)/sales/[id]`,
      params: { id: sale.id.toString() },
    });
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "#22c55e";
      case "partial":
        return "#f59e0b";
      case "unpaid":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getPaymentStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "checkmark-circle";
      case "partial":
        return "time";
      case "unpaid":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 168) {
      // Less than a week
      return date.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      sale.customer_name?.toLowerCase().includes(query) ||
      sale.id.toString().includes(query) ||
      sale.salesperson_name?.toLowerCase().includes(query) ||
      sale.payment_method?.toLowerCase().includes(query)
    );
  });

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <TouchableOpacity
      style={styles.saleCard}
      onPress={() => handleSalePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.saleHeader}>
        <View style={styles.saleInfo}>
          <Text style={styles.saleId}>Sale #{item.id}</Text>
          <Text style={styles.saleDate}>{formatDate(item.created_at)}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {formatCurrency(item.total_amount || 0)}
          </Text>
          <View
            style={[
              styles.paymentStatus,
              { backgroundColor: getPaymentStatusColor(item.payment_status) },
            ]}
          >
            <Ionicons
              name={getPaymentStatusIcon(item.payment_status) as any}
              size={12}
              color="#ffffff"
            />
            <Text style={styles.paymentStatusText}>
              {item.payment_status || "Unknown"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.saleDetails}>
        {item.customer_name && (
          <Text style={styles.customerName}>
            Customer: {item.customer_name}
          </Text>
        )}
        <Text style={styles.paymentMethod}>
          Payment: {item.payment_method || "Not specified"}
        </Text>
        {item.balance && item.balance > 0 && (
          <Text style={styles.balance}>
            Balance: {formatCurrency(item.balance)}
          </Text>
        )}
      </View>

      <View style={styles.saleFooter}>
        <Text style={styles.itemCount}>
          {item.items?.length || item.products_sold?.length || 0} item(s)
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#6b7280" />
      </View>
    </TouchableOpacity>
  );

  const renderDateFilter = () => (
    <View style={styles.filterContainer}>
      {["all", "today", "week", "month"].map((filter) => (
        <TouchableOpacity
          key={filter}
          style={[
            styles.filterButton,
            dateFilter === filter && styles.filterButtonActive,
          ]}
          onPress={() => setDateFilter(filter)}
        >
          <Text
            style={[
              styles.filterButtonText,
              dateFilter === filter && styles.filterButtonTextActive,
            ]}
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color="#9ca3af" />
      <Text style={styles.emptyText}>No sales found</Text>
      <Text style={styles.emptySubtext}>
        {dateFilter === "all"
          ? "You haven't made any sales yet"
          : `No sales found for ${
              dateFilter === "today" ? "today" : `the past ${dateFilter}`
            }`}
      </Text>
    </View>
  );

  if (isLoading && sales.length === 0 && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "My Sales" }} />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading sales...</Text>
      </View>
    );
  }

  if (error && sales.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen options={{ title: "My Sales" }} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchSales()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "My Sales" }} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by customer, sale ID, or payment method..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Date Filters */}
      {renderDateFilter()}

      {/* Sales Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredSales.length} sale{filteredSales.length !== 1 ? "s" : ""}{" "}
          found
        </Text>
        <Text style={styles.totalAmount}>
          Total:{" "}
          {formatCurrency(
            filteredSales.reduce(
              (sum, sale) => sum + (sale.total_amount || 0),
              0
            )
          )}
        </Text>
      </View>

      {/* Sales List */}
      <FlatList
        data={filteredSales}
        renderItem={renderSaleItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.salesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          filteredSales.length === 0 ? styles.emptyListContainer : undefined
        }
        showsVerticalScrollIndicator={false}
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
  filterContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  summaryText: {
    fontSize: 14,
    color: "#6b7280",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  salesList: {
    flex: 1,
  },
  saleCard: {
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
  saleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  saleInfo: {
    flex: 1,
  },
  saleId: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 4,
  },
  saleDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  paymentMethod: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 2,
  },
  balance: {
    fontSize: 14,
    color: "#dc2626",
    fontWeight: "500",
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  itemCount: {
    fontSize: 14,
    color: "#6b7280",
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
