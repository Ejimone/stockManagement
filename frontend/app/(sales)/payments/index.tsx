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
  getSales,
  displayPdfReceipt,
  Payment,
  PaymentSummary,
  PaymentFilters,
  Sale,
} from "../../../services/api";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";
import { useAuth } from "../../../contexts/AuthContext";

export default function SalespersonPaymentsScreen() {
  const { user } = useAuth();
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

  // Modal states for detailed views
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalType, setModalType] = useState<
    "payments" | "sales" | "customers"
  >("payments");

  // Click handlers for summary cards
  const handleTotalPaymentsClick = async () => {
    try {
      setModalTitle("All Payments Received");
      setModalType("sales");
      // Get all sales for this user (payments come from sales.amount_paid + payment records)
      const response = await getSales({
        salesperson: user?.id,
      });

      // Filter to show only sales that have payments (amount_paid > 0)
      const salesWithPayments = (response.results || response).filter(
        (sale) => sale.amount_paid && sale.amount_paid > 0
      );

      setModalData(salesWithPayments);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load payments data");
    }
  };
  const handleOutstandingPaymentsClick = async () => {
    try {
      setModalTitle("Outstanding Credits (₦1000+)");
      setModalType("sales");
      // Get all sales for this user and filter for credits over 1000
      const response = await getSales({
        salesperson: user?.id,
      });

      // Filter for credits over 1000 (both Unpaid and Partial)
      const largeCreditSales = (response.results || response).filter(
        (sale) =>
          sale.balance &&
          sale.balance >= 1000 &&
          (sale.payment_status === "Unpaid" ||
            sale.payment_status === "Partial")
      );

      setModalData(largeCreditSales);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load outstanding sales");
    }
  };

  const handlePartialPaymentsClick = async () => {
    try {
      setModalTitle("Balance to Collect from Customers");
      setModalType("sales");
      // Get all partial payments without filters
      const response = await getSales({
        payment_status: "Partial",
        salesperson: user?.id,
      });
      setModalData(response.results || response);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load partial payment sales");
    }
  };

  const handleCreditSalesClick = async () => {
    try {
      setModalTitle("All Credit Sales");
      setModalType("sales");
      // Get all sales without filters and filter for credit sales
      const response = await getSales({
        salesperson: user?.id,
      });

      // Filter credit sales on the frontend since the API doesn't support filtering by payment_method
      const creditSales = (response.results || response).filter(
        (sale) => sale.payment_method?.toLowerCase() === "credit"
      );

      setModalData(creditSales);
      setModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load credit sales");
    }
  };

  const handleCustomersWithDebtClick = () => {
    if (
      summary?.customers_with_debt &&
      summary.customers_with_debt.length > 0
    ) {
      setModalTitle("Customers with Outstanding Debt");
      setModalType("customers");
      setModalData(summary.customers_with_debt);
      setModalVisible(true);
    } else {
      Alert.alert("Info", "No customers have outstanding debt");
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Create filters for summary (date filters only since backend handles user filtering)
      const summaryFilters: { date_from?: string; date_to?: string } = {};
      if (filters.date_from) summaryFilters.date_from = filters.date_from;
      if (filters.date_to) summaryFilters.date_to = filters.date_to;

      const [paymentsResponse, summaryResponse] = await Promise.all([
        getPayments(filters),
        getPaymentSummary(summaryFilters),
      ]);

      setPayments(paymentsResponse.results);
      setSummary(summaryResponse);

      // Debug log to see what we're getting (console only, not UI)
      console.log("Payment Summary Response:", summaryResponse);
      console.log("User ID:", user?.id);
      console.log("Payments Response:", paymentsResponse);
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
          To Collect: {formatCurrency(item.sale_balance || 0)}
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

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "#34C759";
      case "partial":
        return "#FF9500";
      case "unpaid":
        return "#FF3B30";
      default:
        return "#8E8E93";
    }
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>My Payment Summary</Text>
      <View style={styles.summaryGrid}>
        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.7}
          onPress={handleTotalPaymentsClick}
        >
          <View style={styles.summaryItemInner}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.total_payments || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Total Payments Received</Text>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="cash-outline" size={18} color="#007AFF" />
              <Ionicons name="chevron-forward" size={14} color="#007AFF" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.7}
          onPress={handleOutstandingPaymentsClick}
        >
          <View style={styles.summaryItemInner}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.credits_over_1000 || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Credits Over ₦1000</Text>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="alert-circle-outline" size={18} color="#FF3B30" />
              <Ionicons name="chevron-forward" size={14} color="#007AFF" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.7}
          onPress={handlePartialPaymentsClick}
        >
          <View style={styles.summaryItemInner}>
            <Text style={styles.summaryValue}>
              {formatCurrency(summary?.total_partial_debts || 0)}
            </Text>
            <Text style={styles.summaryLabel}>Balance to Collect</Text>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="time-outline" size={18} color="#FF9500" />
              <Ionicons name="chevron-forward" size={14} color="#007AFF" />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryItem}
          activeOpacity={0.7}
          onPress={handleCreditSalesClick}
        >
          <View style={styles.summaryItemInner}>
            <Text style={styles.summaryValue}>
              {summary?.credit_sales_count || 0}
            </Text>
            <Text style={styles.summaryLabel}>Credit Sales Count</Text>
            <View style={styles.summaryIconContainer}>
              <Ionicons name="card-outline" size={18} color="#34C759" />
              <Ionicons name="chevron-forward" size={14} color="#007AFF" />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {summary?.customers_with_debt &&
        summary.customers_with_debt.length > 0 && (
          <TouchableOpacity
            style={styles.customersDebtCard}
            activeOpacity={0.7}
            onPress={handleCustomersWithDebtClick}
          >
            <View style={styles.customersDebtHeader}>
              <View style={styles.customersDebtHeaderLeft}>
                <Ionicons name="people-outline" size={18} color="#856404" />
                <Text style={styles.customersDebtTitle}>
                  Customers with Outstanding Debt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#856404" />
            </View>
            <Text style={styles.customersDebtCount}>
              {summary.customers_with_debt.length} customer
              {summary.customers_with_debt.length !== 1 ? "s" : ""} with
              outstanding balance
            </Text>
          </TouchableOpacity>
        )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "My Payment Summary",
          headerShown: true,
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

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading payments data...</Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={summary ? renderSummaryCard() : null}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name="document-outline" size={64} color="#ccc" />
              <Text style={styles.emptyStateText}>No payments found</Text>
              <Text style={styles.emptyStateSubtext}>
                Payments will appear here once recorded
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={[
            styles.listContainer,
            payments.length === 0 && { flex: 1, justifyContent: "center" },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

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

      {/* Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {modalData.length > 0 ? (
              <FlatList
                data={modalData}
                keyExtractor={(item, index) =>
                  `${modalType}-${item.id || index}`
                }
                renderItem={({ item }) => {
                  if (modalType === "payments") {
                    return (
                      <TouchableOpacity
                        style={styles.modalListItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          setModalVisible(false);
                          router.push(`/(sales)/payments/${item.id}` as any);
                        }}
                      >
                        <View style={styles.modalItemHeader}>
                          <Text style={styles.modalItemTitle}>
                            {item.sale_customer || "Unknown Customer"}
                          </Text>
                          <Text style={styles.modalItemAmount}>
                            {formatCurrency(item.amount)}
                          </Text>
                        </View>
                        <Text style={styles.modalItemSubtitle}>
                          {item.payment_method} •{" "}
                          {formatDateTime(item.created_at)}
                        </Text>
                        <View style={styles.modalItemFooter}>
                          <Text
                            style={[
                              styles.modalItemStatus,
                              { color: getStatusColor(item.status) },
                            ]}
                          >
                            {item.status}
                          </Text>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#aaa"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  } else if (modalType === "sales") {
                    return (
                      <TouchableOpacity
                        style={styles.modalListItem}
                        activeOpacity={0.7}
                        onPress={() => {
                          setModalVisible(false);
                          router.push(`/(sales)/sales/${item.id}` as any);
                        }}
                      >
                        <View style={styles.modalItemHeader}>
                          <Text style={styles.modalItemTitle}>
                            {item.customer_name || "Unknown Customer"}
                          </Text>
                          <Text style={styles.modalItemAmount}>
                            {formatCurrency(item.total_amount || 0)}
                          </Text>
                        </View>
                        <Text style={styles.modalItemSubtitle}>
                          {item.payment_method || "Unknown"} •{" "}
                          {formatDateTime(item.created_at || "")}
                        </Text>
                        <View style={styles.modalItemFooter}>
                          <View style={styles.modalItemStatusContainer}>
                            <Text
                              style={[
                                styles.modalItemStatus,
                                {
                                  color: getPaymentStatusColor(
                                    item.payment_status || ""
                                  ),
                                },
                              ]}
                            >
                              {item.payment_status || "Unknown"}
                            </Text>
                            {item.balance > 0 && (
                              <Text
                                style={[
                                  styles.modalItemBalance,
                                  { fontWeight: "700" },
                                ]}
                              >
                                To collect: {formatCurrency(item.balance)}
                              </Text>
                            )}
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#aaa"
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  } else if (modalType === "customers") {
                    return (
                      <View style={styles.modalListItem}>
                        <View style={styles.modalItemHeader}>
                          <Text style={styles.modalItemTitle}>
                            {item.customer_name || "Unknown Customer"}
                          </Text>
                          <Text style={styles.modalItemAmount}>
                            {formatCurrency(item.total_debt || 0)}
                          </Text>
                        </View>
                        <Text style={styles.modalItemSubtitle}>
                          Phone: {item.customer_phone || "N/A"}
                        </Text>
                        <View style={styles.salesCountBadge}>
                          <Text style={styles.salesCountText}>
                            {item.sales_count || 0} sale
                            {item.sales_count !== 1 ? "s" : ""} with debt
                          </Text>
                        </View>
                      </View>
                    );
                  }
                  return null;
                }}
                contentContainerStyle={styles.modalListContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="document-outline" size={64} color="#ccc" />
                <Text style={styles.emptyStateText}>No data available</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
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
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    // Add press feedback styling
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItemInner: {
    width: "100%",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
    height: 30, // Fixed height to ensure consistent card sizing
  },
  summaryIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  customersDebtCard: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
    // Add press feedback styling
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  customersDebtHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  customersDebtHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customersDebtTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginLeft: 8,
  },
  customersDebtCount: {
    fontSize: 12,
    color: "#856404",
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
  closeButton: {
    padding: 4,
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
  modalListContainer: {
    padding: 16,
  },
  modalListItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    // Add press feedback styling
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modalItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  modalItemAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  modalItemStatus: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  modalItemStatusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  modalItemBalance: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "600",
    marginLeft: 8,
  },
  modalItemFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  modalItemStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  salesCountBadge: {
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  salesCountText: {
    fontSize: 12,
    color: "#495057",
  },
  emptyStateContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  modalCloseButton: {
    backgroundColor: "#007AFF",
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
});
