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
  getPaymentSummary,
  displayPdfReceipt,
  Payment,
  PaymentSummary,
  PaymentFilters,
} from "../../../services/api";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";

export default function SalespersonPaymentsScreen() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<PaymentFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filterCustomerName, setFilterCustomerName] = useState("");
  const [filterCustomerPhone, setFilterCustomerPhone] = useState("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("");
  const [filterSaleStatus, setFilterSaleStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, summaryResponse] = await Promise.all([
        getPayments(filters),
        getPaymentSummary(filters),
      ]);

      setPayments(paymentsResponse.results);
      setSummary(summaryResponse);
    } catch (error) {
      console.error("Error loading payments:", error);
      Alert.alert("Error", "Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [filters])
  );

  const applyFilters = () => {
    const newFilters: PaymentFilters = {};

    if (filterCustomerName) newFilters.customer_name = filterCustomerName;
    if (filterCustomerPhone) newFilters.customer_phone = filterCustomerPhone;
    if (filterPaymentMethod) newFilters.payment_method = filterPaymentMethod;
    if (filterSaleStatus) newFilters.sale_payment_status = filterSaleStatus;
    if (filterDateFrom) newFilters.date_from = filterDateFrom;
    if (filterDateTo) newFilters.date_to = filterDateTo;

    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilterCustomerName("");
    setFilterCustomerPhone("");
    setFilterPaymentMethod("");
    setFilterSaleStatus("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilters({});
    setShowFilters(false);
  };

  const handleViewReceipt = async (payment: Payment) => {
    try {
      await displayPdfReceipt(payment.sale);
    } catch (error) {
      Alert.alert("Error", "Failed to display receipt");
    }
  };

  const renderPaymentItem = ({ item }: { item: Payment }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.customerName}>
            {item.sale_customer || "Unknown Customer"}
          </Text>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        </View>
        <View style={styles.paymentActions}>
          <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <Text style={styles.detailText}>
          Phone: {item.sale_customer_phone || "N/A"}
        </Text>
        <Text style={styles.detailText}>Method: {item.payment_method}</Text>
        <Text style={styles.detailText}>
          Sale Balance: {formatCurrency(item.sale_balance || 0)}
        </Text>
        <Text style={styles.detailText}>
          Date: {formatDateTime(item.created_at)}
        </Text>
        <Text style={styles.detailText}>
          Recorded by: {item.recorded_by_name}
        </Text>
      </View>

      {/* Sale Items Summary */}
      {item.sale_items_summary && item.sale_items_summary.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items Purchased:</Text>
          {item.sale_items_summary.map((saleItem, index) => (
            <Text key={index} style={styles.itemText}>
              {saleItem.quantity}x {saleItem.product_name} -{" "}
              {formatCurrency(saleItem.subtotal)}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.receiptButton}
          onPress={() => handleViewReceipt(item)}
        >
          <Ionicons name="receipt-outline" size={16} color="#007AFF" />
          <Text style={styles.buttonText}>Receipt</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => router.push(`/(sales)/payments/${item.id}` as any)}
        >
          <Ionicons name="eye-outline" size={16} color="#34C759" />
          <Text style={styles.buttonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "#34C759";
      case "pending":
        return "#FF9500";
      case "failed":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>My Payment Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary?.total_payments || 0)}
          </Text>
          <Text style={styles.summaryLabel}>Total Payments</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary?.total_credits || 0)}
          </Text>
          <Text style={styles.summaryLabel}>Outstanding Credits</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {formatCurrency(summary?.total_partial_debts || 0)}
          </Text>
          <Text style={styles.summaryLabel}>Partial Payments</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {summary?.credit_sales_count || 0}
          </Text>
          <Text style={styles.summaryLabel}>Credit Sales</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Payments & Credits",
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowFilters(true)}
            >
              <Ionicons name="filter" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={summary ? renderSummaryCard() : null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Payments</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterForm}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Customer Name</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterCustomerName}
                  onChangeText={setFilterCustomerName}
                  placeholder="Enter customer name"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Customer Phone</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterCustomerPhone}
                  onChangeText={setFilterCustomerPhone}
                  placeholder="Enter phone number"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Payment Method</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterPaymentMethod}
                  onChangeText={setFilterPaymentMethod}
                  placeholder="Cash, Credit, Mobile Money"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Sale Status</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterSaleStatus}
                  onChangeText={setFilterSaleStatus}
                  placeholder="paid, partial, unpaid"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Date From (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterDateFrom}
                  onChangeText={setFilterDateFrom}
                  placeholder="2024-01-01"
                />
              </View>

              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Date To (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.filterInput}
                  value={filterDateTo}
                  onChangeText={setFilterDateTo}
                  placeholder="2024-12-31"
                />
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
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
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  listContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    width: "48%",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
  },
  paymentActions: {
    alignItems: "flex-end",
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  paymentDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itemsSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  itemText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  receiptButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  detailButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f0fff0",
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  buttonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterForm: {
    padding: 20,
  },
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  filterInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
