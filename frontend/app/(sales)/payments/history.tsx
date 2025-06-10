import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import {
  getPayments,
  getSales,
  Payment,
  PaymentFilters,
  Sale,
} from "../../../services/api";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function PaymentHistoryScreen() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [combinedHistory, setCombinedHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Filter states
  const [filterCustomerName, setFilterCustomerName] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterMinAmount, setFilterMinAmount] = useState("");
  const [filterMaxAmount, setFilterMaxAmount] = useState("");

  // Modal states for detailed views
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Load payment and sales history
  const loadHistory = async () => {
    try {
      setLoading(true);

      // Build filters
      const filters: any = {};
      if (filterCustomerName) filters.customer_name = filterCustomerName;
      if (filterDateFrom) filters.date_from = filterDateFrom;
      if (filterDateTo) filters.date_to = filterDateTo;

      // Get both payments and sales data
      const [paymentsResponse, salesResponse] = await Promise.all([
        getPayments(filters),
        getSales({
          salesperson: user?.id,
          ...filters,
        }),
      ]);

      const paymentsData = paymentsResponse.results || paymentsResponse;
      const salesData = salesResponse.results || salesResponse;

      setPayments(paymentsData);
      setSales(salesData);

      // Combine and format history data
      const combined = [
        // Payment records
        ...paymentsData.map((payment: Payment) => ({
          id: `payment-${payment.id}`,
          type: "payment",
          date: payment.created_at,
          customerName: (payment.sale as any)?.customer_name || "Unknown",
          amount: payment.amount,
          method: payment.payment_method,
          status: payment.status,
          reference: payment.reference_number,
          saleId: (payment.sale as any)?.id,
          originalData: payment,
        })),
        // Sales records (showing amount paid portion)
        ...salesData
          .filter((sale: Sale) => (sale.amount_paid || 0) > 0)
          .map((sale: Sale) => ({
            id: `sale-${sale.id}`,
            type: "sale_payment",
            date: sale.created_at,
            customerName: sale.customer_name || "Unknown",
            amount: sale.amount_paid || 0,
            method: sale.payment_method,
            status: sale.payment_status,
            totalAmount: sale.total_amount,
            balance: sale.balance,
            saleId: sale.id,
            originalData: sale,
          })),
      ];

      // Apply amount filters
      let filteredHistory = combined;
      if (filterMinAmount) {
        filteredHistory = filteredHistory.filter(
          (item) => (item.amount || 0) >= parseFloat(filterMinAmount)
        );
      }
      if (filterMaxAmount) {
        filteredHistory = filteredHistory.filter(
          (item) => (item.amount || 0) <= parseFloat(filterMaxAmount)
        );
      }

      // Sort the combined history
      const sortedHistory = filteredHistory.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case "date":
            comparison =
              new Date(a.date || "").getTime() -
              new Date(b.date || "").getTime();
            break;
          case "name":
            comparison = (a.customerName || "").localeCompare(
              b.customerName || ""
            );
            break;
          case "amount":
            comparison = (a.amount || 0) - (b.amount || 0);
            break;
        }

        return sortOrder === "desc" ? -comparison : comparison;
      });

      setCombinedHistory(sortedHistory);
    } catch (error) {
      console.error("Error loading payment history:", error);
      Alert.alert("Error", "Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [
    filterCustomerName,
    filterDateFrom,
    filterDateTo,
    filterMinAmount,
    filterMaxAmount,
    sortBy,
    sortOrder,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  useEffect(() => {
    loadHistory();
  }, [
    filterCustomerName,
    filterDateFrom,
    filterDateTo,
    filterMinAmount,
    filterMaxAmount,
    sortBy,
    sortOrder,
  ]);

  const applyFilters = () => {
    setShowFilters(false);
    loadHistory();
  };

  const clearFilters = () => {
    setFilterCustomerName("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterMinAmount("");
    setFilterMaxAmount("");
    setShowFilters(false);
    loadHistory();
  };

  const handleItemPress = (item: any) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const getStatusColor = (status: string, type: string) => {
    if (type === "payment") {
      switch (status?.toLowerCase()) {
        case "completed":
          return "#4CAF50";
        case "pending":
          return "#FF9800";
        case "failed":
          return "#F44336";
        default:
          return "#757575";
      }
    } else {
      switch (status?.toLowerCase()) {
        case "paid":
          return "#4CAF50";
        case "partial":
          return "#FF9800";
        case "unpaid":
          return "#F44336";
        default:
          return "#757575";
      }
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemTitleContainer}>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View
            style={[
              styles.typeTag,
              {
                backgroundColor:
                  item.type === "payment" ? "#E3F2FD" : "#F3E5F5",
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                { color: item.type === "payment" ? "#1976D2" : "#7B1FA2" },
              ]}
            >
              {item.type === "payment" ? "Payment" : "Sale Payment"}
            </Text>
          </View>
        </View>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
      </View>

      <View style={styles.itemDetails}>
        <Text style={styles.detailText}>
          <Ionicons name="card-outline" size={14} color="#666" /> {item.method}
        </Text>
        <Text style={styles.detailText}>
          <Ionicons name="time-outline" size={14} color="#666" />{" "}
          {formatDateTime(item.date)}
        </Text>
      </View>

      <View style={styles.itemFooter}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status, item.type) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderSortButton = (
    label: string,
    value: "date" | "name" | "amount"
  ) => (
    <TouchableOpacity
      style={[styles.sortButton, sortBy === value && styles.sortButtonActive]}
      onPress={() => {
        if (sortBy === value) {
          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
          setSortBy(value);
          setSortOrder("desc");
        }
      }}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === value && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
      {sortBy === value && (
        <Ionicons
          name={sortOrder === "asc" ? "arrow-up" : "arrow-down"}
          size={16}
          color="#fff"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Payment History",
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Sort Controls */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortButtonContainer}
        >
          {renderSortButton("Date", "date")}
          {renderSortButton("Customer", "name")}
          {renderSortButton("Amount", "amount")}
        </ScrollView>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <ScrollView>
            <Text style={styles.filtersTitle}>Filter Payment History</Text>

            <TextInput
              style={styles.filterInput}
              placeholder="Customer Name"
              value={filterCustomerName}
              onChangeText={setFilterCustomerName}
            />

            <View style={styles.dateFilterRow}>
              <TextInput
                style={[styles.filterInput, styles.dateInput]}
                placeholder="From Date (YYYY-MM-DD)"
                value={filterDateFrom}
                onChangeText={setFilterDateFrom}
              />
              <TextInput
                style={[styles.filterInput, styles.dateInput]}
                placeholder="To Date (YYYY-MM-DD)"
                value={filterDateTo}
                onChangeText={setFilterDateTo}
              />
            </View>

            <View style={styles.amountFilterRow}>
              <TextInput
                style={[styles.filterInput, styles.amountInput]}
                placeholder="Min Amount"
                value={filterMinAmount}
                onChangeText={setFilterMinAmount}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.filterInput, styles.amountInput]}
                placeholder="Max Amount"
                value={filterMaxAmount}
                onChangeText={setFilterMaxAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.filterButtonsRow}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={combinedHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No payment history found</Text>
            <Text style={styles.emptyStateSubtext}>
              {loading ? "Loading..." : "Try adjusting your filters"}
            </Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedItem?.type === "payment"
                ? "Payment Details"
                : "Sale Payment Details"}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {selectedItem && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Customer Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedItem.customerName}
                  </Text>
                </View>
                {selectedItem.originalData?.customer_phone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItem.originalData.customer_phone}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {formatCurrency(selectedItem.amount)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Method:</Text>
                  <Text style={styles.detailValue}>{selectedItem.method}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          selectedItem.status,
                          selectedItem.type
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{selectedItem.status}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatDateTime(selectedItem.date)}
                  </Text>
                </View>
                {selectedItem.reference && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reference:</Text>
                    <Text style={styles.detailValue}>
                      {selectedItem.reference}
                    </Text>
                  </View>
                )}
              </View>

              {selectedItem.type === "sale_payment" && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Sale Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Sale Amount:</Text>
                    <Text style={styles.detailValue}>
                      {formatCurrency(selectedItem.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Remaining Balance:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        selectedItem.balance > 0 && styles.balanceValue,
                      ]}
                    >
                      {formatCurrency(selectedItem.balance)}
                    </Text>
                  </View>
                </View>
              )}

              {selectedItem.saleId && (
                <TouchableOpacity
                  style={styles.viewSaleButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push(`/(sales)/sales/${selectedItem.saleId}` as any);
                  }}
                >
                  <Ionicons name="receipt-outline" size={20} color="#007AFF" />
                  <Text style={styles.viewSaleButtonText}>
                    View Full Sale Details
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerButton: {
    marginRight: 16,
  },
  sortContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  sortButtonContainer: {
    flexDirection: "row",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#007AFF",
  },
  sortButtonText: {
    fontSize: 14,
    color: "#666",
    marginRight: 4,
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  filtersContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    maxHeight: 300,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateInput: {
    flex: 0.48,
  },
  amountFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  amountInput: {
    flex: 0.48,
  },
  filterButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  clearButton: {
    flex: 0.48,
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  applyButton: {
    flex: 0.48,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  itemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    fontWeight: "600",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "400",
  },
  amountValue: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  balanceValue: {
    color: "#FF9800",
    fontWeight: "600",
  },
  viewSaleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  viewSaleButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
