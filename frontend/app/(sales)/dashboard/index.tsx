import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import {
  getDashboardStats,
  getSales,
  getSalesReport,
  getPayments,
  getComprehensiveReports,
  updateSalePaymentStatus,
} from "../../../services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";

// Define interfaces for our data types
interface SaleItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    id: number;
  };
}

interface APISale {
  id: number;
  created_at: string;
  total_amount: number;
  amount_paid: number;
  balance: number;
  payment_status: string;
  payment_method: string;
  customer_name: string;
  items?: SaleItem[];
  products_sold?: SaleItem[];
}

interface PaymentRecord {
  id: number;
  uniqueKey?: string;
  type: "payment" | "sale_payment";
  amount: number;
  payment_method: string;
  created_at: string;
  sale_id: number;
  customer_name: string;
}

type ModalItem = APISale | PaymentRecord;

// Define the dashboard stats interface
interface SalespersonDashboardStats {
  my_sales_today: number;
  my_revenue_today: number;
  my_sales_this_month: number;
  my_revenue_this_month: number;
  my_pending_sales?: number;
  my_pending_amount?: number;
}

// Enhanced MetricCard component with click functionality
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  context?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  gradient?: string[];
  isLoading?: boolean;
}> = ({ label, value, context, icon, onPress, gradient, isLoading }) => {
  const scaleAnim = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const CardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ scale: scaleAnim }],
          backgroundColor: gradient ? undefined : "#FFFFFF",
        },
      ]}
    >
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
        {context && <Text style={styles.cardContext}>{context}</Text>}
        {onPress && (
          <View style={styles.tapHint}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Text style={styles.tapHintText}>Tap for details</Text>
                <MaterialIcons name="touch-app" size={14} color="#007AFF" />
              </>
            )}
          </View>
        )}
      </View>
      {icon && <View style={styles.cardIcon}>{icon}</View>}
    </Animated.View>
  );

  return onPress ? (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.7}
    >
      {CardContent}
    </TouchableOpacity>
  ) : (
    CardContent
  );
};

// Helper function to convert API sale to our internal format
const convertAPIToInternalSale = (sale: any): APISale => ({
  id: Number(sale.id),
  created_at: sale.created_at,
  total_amount: Number(sale.total_amount || 0),
  amount_paid: Number(sale.amount_paid || 0),
  balance: Number(sale.balance || 0),
  payment_status: sale.payment_status || "unknown",
  payment_method: sale.payment_method || "",
  customer_name: sale.customer_name || "",
  items: sale.items || [],
  products_sold: sale.products_sold || [],
});

export default function SalespersonDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<SalespersonDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<ModalItem[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Raw data states for calculations
  const [allSales, setAllSales] = useState<APISale[]>([]);
  const [todaySales, setTodaySales] = useState<APISale[]>([]);
  const [monthSales, setMonthSales] = useState<APISale[]>([]);
  const [pendingSales, setPendingSales] = useState<APISale[]>([]);

  // Recent activity from comprehensive reports
  const [recentActivity, setRecentActivity] = useState<{
    sales: any[];
    payments: any[];
  }>({ sales: [], payments: [] });

  const fetchComprehensiveData = async () => {
    try {
      console.log(
        "Sales dashboard: Fetching comprehensive data using getComprehensiveReports"
      );
      setError(null);

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Use the same date logic as "My Sales" page for consistency
      // "Month" filter = last 30 days (not current calendar month)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthStartStr = monthAgo.toISOString().split("T")[0];

      // Fetch comprehensive reports data - this gives us everything including recent activity
      // Use last 30 days to match "My Sales" page exactly
      const comprehensiveData = await getComprehensiveReports({
        date_from: monthStartStr,
        date_to: todayStr,
      });

      console.log("Comprehensive data received:", comprehensiveData);

      // Extract recent activity (this is the key data structure from Reports page)
      if (comprehensiveData.recent_activity) {
        setRecentActivity({
          sales: comprehensiveData.recent_activity.sales || [],
          payments: comprehensiveData.recent_activity.payments || [],
        });
      }

      // Also fetch today's data specifically for "today" metrics
      const todayComprehensiveData = await getComprehensiveReports({
        date_from: todayStr,
        date_to: todayStr,
      });

      console.log(
        "Today's comprehensive data received:",
        todayComprehensiveData
      );

      // Fetch individual sales data using the SAME logic as "My Sales" page
      const [todayResponse, monthResponse, pendingResponse] = await Promise.all(
        [
          // Today's sales - same as "My Sales" page today filter
          getSales({
            date_from: todayStr,
            date_to: todayStr,
            salesperson: user?.id,
          }).catch((err) => {
            console.warn("Today's sales failed:", err);
            return { results: [] };
          }),
          // Month's sales - same as "My Sales" page month filter (last 30 days)
          getSales({
            date_from: monthStartStr, // Last 30 days, not current month
            salesperson: user?.id,
          }).catch((err) => {
            console.warn("Month's sales failed:", err);
            return { results: [] };
          }),
          // Pending sales - same as "My Sales" page
          getSales({
            payment_status: "unpaid",
            salesperson: user?.id,
          }).catch((err) => {
            console.warn("Pending sales failed:", err);
            return { results: [] };
          }),
        ]
      );

      // Convert API data to internal format
      const todaySalesData = (todayResponse?.results || []).map(
        convertAPIToInternalSale
      );
      const monthSalesData = (monthResponse?.results || []).map(
        convertAPIToInternalSale
      );
      const pendingSalesData = (pendingResponse?.results || []).map(
        convertAPIToInternalSale
      );

      setTodaySales(todaySalesData);
      setMonthSales(monthSalesData);
      setPendingSales(pendingSalesData);
      setAllSales([...monthSalesData, ...pendingSalesData]);

      // Use the same approach as Reports page - get stats from comprehensive reports
      const calculatedStats: SalespersonDashboardStats = {
        // Today's metrics from today's comprehensive report
        my_sales_today: todayComprehensiveData?.sales_summary?.total_sales || 0,
        my_revenue_today:
          todayComprehensiveData?.sales_summary?.total_revenue || 0,
        // Month's metrics from last 30 days comprehensive report (matching "My Sales" page)
        my_sales_this_month: comprehensiveData?.sales_summary?.total_sales || 0,
        my_revenue_this_month:
          comprehensiveData?.sales_summary?.total_revenue || 0,
        // Pending from credit summary
        my_pending_sales:
          comprehensiveData?.credit_summary?.total_unpaid_sales || 0,
        my_pending_amount:
          comprehensiveData?.credit_summary?.total_outstanding_balance || 0,
      };

      setStats(calculatedStats);

      console.log("Sales dashboard: Comprehensive data fetched successfully");
      console.log(
        "Recent activity sales:",
        comprehensiveData.recent_activity?.sales?.length || 0
      );
      console.log(
        "Recent activity payments:",
        comprehensiveData.recent_activity?.payments?.length || 0
      );
      console.log(
        "Today's sales summary:",
        todayComprehensiveData?.sales_summary
      );
      console.log(
        "Month's sales summary (last 30 days):",
        comprehensiveData?.sales_summary
      );
      console.log("Credit summary:", comprehensiveData?.credit_summary);
      console.log("Calculated stats:", calculatedStats);
      console.log(
        "Month date range:",
        monthStartStr,
        "to",
        todayStr,
        "(last 30 days - same as My Sales page)"
      );
    } catch (err: any) {
      console.error("Failed to fetch comprehensive dashboard data:", err);

      let errorMessage =
        "Failed to fetch your dashboard data. Please try again.";

      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        errorMessage = `Server error (${err.response.status}): ${JSON.stringify(
          err.response.data
        )}`;
      } else if (err.request) {
        console.error("No response received");
        errorMessage = "Network error: No response from server";
      } else {
        console.error("Error details:", err.message);
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      setStats(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDetailedSales = async (type: "today" | "month" | "pending") => {
    setModalLoading(true);
    try {
      let salesData: APISale[] = [];

      switch (type) {
        case "today":
          salesData = todaySales;
          setModalTitle("My Sales Today");
          break;
        case "month":
          salesData = monthSales;
          setModalTitle("My Sales (Last 30 Days)");
          break;
        case "pending":
          salesData = pendingSales;
          setModalTitle("My Pending Sales");
          break;
      }

      // If local data is empty, try to fetch fresh data
      if (salesData.length === 0) {
        console.log(`No local ${type} data, fetching fresh data...`);

        const today = new Date();
        let params: any = {};

        switch (type) {
          case "today":
            const todayStr = today.toISOString().split("T")[0];
            params = { date_from: todayStr, date_to: todayStr };
            break;
          case "month":
            // Use the SAME logic as "My Sales" page - last 30 days, not current month
            const monthAgo = new Date(
              today.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            params = { date_from: monthAgo.toISOString().split("T")[0] };
            break;
          case "pending":
            params = { payment_status: "unpaid" };
            break;
        }

        if (user?.id) {
          params.salesperson = user.id;
        }

        const response = await getSales(params);
        salesData = (response.results || []).map(convertAPIToInternalSale);

        // Update local state with converted data
        switch (type) {
          case "today":
            setTodaySales(salesData);
            break;
          case "month":
            setMonthSales(salesData);
            break;
          case "pending":
            setPendingSales(salesData);
            break;
        }
      }

      setModalData(salesData);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch detailed sales:", error);
      setModalData([]);
    } finally {
      setModalLoading(false);
    }
  };

  // New function to fetch and display payment records (like Recent Activity)
  const fetchDetailedPayments = async (type: "revenue") => {
    setModalLoading(true);
    try {
      // Fetch all payments for the last 30 days (same period as revenue calculation)
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      let paymentData: PaymentRecord[] = [];

      // Get recent activity payments (these are from the comprehensive reports API)
      if (recentActivity.payments.length > 0) {
        // Convert recent activity payments to our format
        paymentData = recentActivity.payments.map(
          (payment: any, index: number) => ({
            id: payment.id,
            uniqueKey: `payment-record-${payment.id}-${index}`,
            type: "payment",
            amount: payment.amount,
            payment_method: payment.payment_method,
            created_at: payment.created_at,
            sale_id: payment.sale || payment.sale_id,
            customer_name:
              payment.sale__customer_name ||
              payment.customer_name ||
              "Unknown Customer",
            payment_status: "completed",
          })
        );
      }

      // Also include sales with payments from the current month's data
      // Deduplicate sales to avoid duplicate keys (today's sales are included in month's sales)
      const allSalesMap = new Map();
      [...todaySales, ...monthSales].forEach((sale) => {
        allSalesMap.set(sale.id, sale);
      });
      const uniqueSales = Array.from(allSalesMap.values());

      const salesWithPayments = uniqueSales
        .filter((sale: APISale) => (sale.amount_paid || 0) > 0)
        .map((sale: APISale, index: number) => ({
          id: `sale-payment-${sale.id}-${index}`,
          uniqueKey: `sale-payment-${sale.id}-${index}-${Date.now()}`,
          type: "sale_payment",
          amount: sale.amount_paid || 0,
          payment_method: sale.payment_method || "Unknown",
          created_at: sale.created_at,
          sale_id: sale.id,
          customer_name: sale.customer_name || "Unknown Customer",
          payment_status: sale.payment_status,
        }));

      // Combine and sort by date (most recent first)
      const combinedPayments = [...paymentData, ...salesWithPayments].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setModalTitle("Payment Details (Last 30 Days)");
      setModalData(combinedPayments as any);
      setModalVisible(true);
    } catch (error) {
      console.error("Failed to fetch payment details:", error);
      setModalData([]);
      setModalVisible(true);
    } finally {
      setModalLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchComprehensiveData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchComprehensiveData();
  }, []);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading Your Dashboard...</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchComprehensiveData}
        >
          <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== "number") return "₦0.00";
    return `₦${value.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper functions for payment status (copied from My Sales page)
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

  const formatDateForSales = (dateString?: string) => {
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

  const handleMarkAsPaid = async (sale: APISale, event: any) => {
    // Prevent the TouchableOpacity press event from firing
    event.stopPropagation();

    // Do nothing if the sale is already paid
    const isPaid = sale.payment_status?.toLowerCase() === "paid";
    if (isPaid) {
      return; // Exit early, no action for paid sales
    }

    try {
      Alert.alert(
        "Mark as Paid",
        `Are you sure you want to mark Sale #${sale.id} as fully paid?`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Mark as Paid",
            style: "default",
            onPress: async () => {
              try {
                setModalLoading(true);
                await updateSalePaymentStatus(sale.id);

                // Update the sale in the local modal data
                setModalData((prevSales) =>
                  prevSales.map((s) =>
                    s.id === sale.id
                      ? {
                          ...s,
                          payment_status: "paid",
                          amount_paid: s.total_amount,
                          balance: 0,
                        }
                      : s
                  )
                );

                Alert.alert("Success", "Sale marked as paid successfully!");
              } catch (error: any) {
                console.error("Failed to update payment status:", error);
                Alert.alert(
                  "Error",
                  error.response?.data?.error ||
                    "Failed to update payment status. Please try again."
                );
              } finally {
                setModalLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in handleMarkAsPaid:", error);
    }
  };

  const handleSalePress = (sale: APISale) => {
    setModalVisible(false);
    router.push({
      pathname: `/(sales)/sales/[id]`,
      params: { id: sale.id.toString() },
    });
  };

  // Replace the existing updateSaleInModalData function with this version
  const updateSaleInModalData = (saleToUpdate: APISale) => {
    setModalData((prevData) =>
      prevData.map((item) => {
        if ("type" in item) {
          // This is a payment record, leave it unchanged
          return item;
        }
        // This is a sale
        if (item.id === saleToUpdate.id) {
          return {
            ...item,
            payment_status: "paid",
            amount_paid: item.total_amount,
            balance: 0,
          };
        }
        return item;
      })
    );
  };

  // Render sale item exactly like My Sales page
  const renderSaleItem = ({ item }: { item: APISale }) => {
    const canMarkAsPaid =
      item.payment_status?.toLowerCase() === "partial" ||
      item.payment_status?.toLowerCase() === "unpaid";

    return (
      <TouchableOpacity
        style={styles.saleCard}
        onPress={() => handleSalePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleInfo}>
            <Text style={styles.saleId}>Sale #{item.id}</Text>
            <Text style={styles.saleDate}>
              {formatDateForSales(item.created_at)}
            </Text>
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
          {item.customer_name && item.customer_name.trim() && (
            <Text style={styles.customerName}>
              Customer: {item.customer_name}
            </Text>
          )}
          <Text style={styles.paymentMethod}>
            Payment: {item.payment_method || "Not specified"}
          </Text>
          {item.balance !== null &&
            item.balance !== undefined &&
            item.balance > 0 && (
              <Text style={styles.balance}>
                Balance: {formatCurrency(item.balance)}
              </Text>
            )}
        </View>

        <View style={styles.saleFooter}>
          <Text style={styles.itemCount}>
            {item.items?.length || item.products_sold?.length || 0} item(s)
          </Text>
          <View style={styles.saleFooterActions}>
            <TouchableOpacity
              style={[
                styles.markPaidButton,
                {
                  backgroundColor: canMarkAsPaid ? "#22c55e" : "#6b7280",
                  opacity: canMarkAsPaid ? 1 : 0.6,
                },
              ]}
              onPress={
                canMarkAsPaid
                  ? (event) => handleMarkAsPaid(item, event)
                  : undefined
              }
              activeOpacity={canMarkAsPaid ? 0.8 : 1}
              disabled={!canMarkAsPaid}
            >
              <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              <Text style={styles.markPaidButtonText}>
                {canMarkAsPaid
                  ? "Mark as Paid"
                  : `Status: ${item.payment_status || "Unknown"}`}
              </Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color="#6b7280" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render payment item (like Recent Activity section)
  const renderPaymentItem = ({ item }: { item: PaymentRecord }) => {
    const isPaymentRecord = item.type === "payment" || !item.type;
    const isSalePayment = item.type === "sale_payment";

    return (
      <TouchableOpacity
        style={[styles.recentSaleCard, styles.recentPaymentCard]}
        onPress={() => {
          if (item.sale_id) {
            router.push(`/(sales)/sales/${item.sale_id}` as any);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.recentSaleHeader}>
          <Text style={styles.recentSaleId}>
            <MaterialIcons name="payment" size={16} color="#4CAF50" />{" "}
            {isPaymentRecord
              ? `Payment #${item.id}`
              : `Sale Payment #${item.sale_id}`}
          </Text>
          <Text style={[styles.recentSaleAmount, { color: "#4CAF50" }]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <View style={styles.recentSaleDetails}>
          <Text style={styles.recentSaleDate}>
            {formatDate(item.created_at || "")}
          </Text>
          <View
            style={[styles.recentSaleStatus, { backgroundColor: "#E8F5E8" }]}
          >
            <Text style={[styles.recentSaleStatusText, { color: "#4CAF50" }]}>
              RECEIVED
            </Text>
          </View>
        </View>
        <View style={styles.recentSaleFooter}>
          <Text style={styles.recentSaleCustomer}>
            {item.customer_name || "Unknown Customer"} •{" "}
            {item.payment_method || "Unknown Method"}
          </Text>
          {item.sale_id && (
            <Text style={styles.recentSaleProducts}>
              For Sale #{item.sale_id}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailModal = () => {
    const windowHeight = Dimensions.get("window").height;
    const isPaymentList = modalTitle === "Total Revenue (Last 30 Days)";

    const renderItem = ({ item }: { item: ModalItem }) => {
      if ("type" in item) {
        return renderPaymentItem({ item: item as PaymentRecord });
      }
      return renderSaleItem({ item: item as APISale });
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={[styles.modalContainer, { maxHeight: windowHeight * 0.9 }]}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {modalLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading details...</Text>
              </View>
            ) : modalData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="info-outline" size={48} color="#6B7280" />
                <Text style={styles.emptyText}>
                  No {isPaymentList ? "payments" : "sales"} found
                </Text>
              </View>
            ) : (
              <FlatList
                data={modalData}
                renderItem={renderItem}
                keyExtractor={(item) => {
                  if ("type" in item) {
                    return item.uniqueKey || `payment-${item.id}`;
                  }
                  return `sale-${item.id}`;
                }}
                contentContainerStyle={styles.modalList}
                showsVerticalScrollIndicator={true}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListHeaderComponent={() => (
                  <Text style={styles.modalSubtitle}>
                    {isPaymentList
                      ? `${modalData.length} payment${
                          modalData.length === 1 ? "" : "s"
                        }`
                      : `${modalData.length} sale${
                          modalData.length === 1 ? "" : "s"
                        }`}
                  </Text>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#007AFF"]}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeMessage}>
            Welcome back, {user?.first_name || user?.email || "Salesperson"}! 👋
          </Text>
          <Text style={styles.subtitle}>Here's your sales overview</Text>
        </View>

        {error && (
          <Text style={[styles.errorText, { marginBottom: 10 }]}>
            Error: {error}
          </Text>
        )}

        {stats ? (
          <View style={styles.metricsContainer}>
            <MetricCard
              label="Total Revenue (Last 30 Days)"
              value={formatCurrency(stats.my_revenue_this_month)}
              context="Last 30 days earnings"
              icon={
                <MaterialIcons
                  name="account-balance-wallet"
                  size={28}
                  color="#4CAF50"
                />
              }
              onPress={() => fetchDetailedPayments("revenue")}
            />

            <MetricCard
              label="My Sales Today"
              value={stats.my_sales_today?.toString() || "0"}
              context={`Revenue: ${formatCurrency(stats.my_revenue_today)}`}
              icon={<MaterialIcons name="today" size={28} color="#2196F3" />}
              onPress={() => fetchDetailedSales("today")}
            />

            <MetricCard
              label="My Sales (Last 30 Days)"
              value={stats.my_sales_this_month?.toString() || "0"}
              context={`Revenue: ${formatCurrency(
                stats.my_revenue_this_month
              )}`}
              icon={
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={28}
                  color="#9C27B0"
                />
              }
              onPress={() => fetchDetailedSales("month")}
            />

            {stats.my_pending_amount !== undefined && (
              <MetricCard
                label="My Pending Sales (Amount)"
                value={formatCurrency(stats.my_pending_amount)}
                context={`${stats.my_pending_sales || 0} pending sales`}
                icon={
                  <MaterialIcons
                    name="pending-actions"
                    size={28}
                    color="#FF9800"
                  />
                }
                onPress={() => fetchDetailedSales("pending")}
              />
            )}
          </View>
        ) : (
          !isLoading && (
            <View style={styles.noDataContainer}>
              <MaterialIcons name="analytics" size={64} color="#CCCCCC" />
              <Text style={styles.noDataText}>
                No dashboard data available for you at the moment.
              </Text>
            </View>
          )
        )}

        {/* Recent Activity Section */}
        {(recentActivity.sales.length > 0 ||
          recentActivity.payments.length > 0) && (
          <View style={styles.recentActivityContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push("/(sales)/reports")}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {/* Recent Sales */}
            {recentActivity.sales.slice(0, 3).map((sale, index) => (
              <TouchableOpacity
                key={`sale-${sale.id}`}
                style={styles.recentSaleCard}
                onPress={() => {
                  setModalTitle(`Sale #${sale.id} Details`);
                  setModalData([sale]);
                  setModalVisible(true);
                }}
              >
                <View style={styles.recentSaleHeader}>
                  <Text style={styles.recentSaleId}>Sale #{sale.id}</Text>
                  <Text style={styles.recentSaleAmount}>
                    {formatCurrency(sale.total_amount)}
                  </Text>
                </View>
                <View style={styles.recentSaleDetails}>
                  <Text style={styles.recentSaleDate}>
                    {formatDate(sale.created_at || "")}
                  </Text>
                  <View
                    style={[
                      styles.recentSaleStatus,
                      {
                        backgroundColor:
                          sale.payment_status === "paid"
                            ? "#E8F5E8"
                            : sale.payment_status === "partial"
                            ? "#FFF3E0"
                            : "#FFE8E8",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentSaleStatusText,
                        {
                          color:
                            sale.payment_status === "paid"
                              ? "#4CAF50"
                              : sale.payment_status === "partial"
                              ? "#FF9800"
                              : "#F44336",
                        },
                      ]}
                    >
                      {(sale.payment_status || "unpaid").toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.recentSaleFooter}>
                  {sale.customer_name && (
                    <Text style={styles.recentSaleCustomer}>
                      Customer: {sale.customer_name}
                    </Text>
                  )}
                  {sale.products_sold && sale.products_sold.length > 0 && (
                    <Text style={styles.recentSaleProducts}>
                      {sale.products_sold.length} product
                      {sale.products_sold.length !== 1 ? "s" : ""}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {/* Recent Payments */}
            {recentActivity.payments.slice(0, 2).map((payment, index) => (
              <TouchableOpacity
                key={`payment-${payment.id}`}
                style={[styles.recentSaleCard, styles.recentPaymentCard]}
              >
                <View style={styles.recentSaleHeader}>
                  <Text style={styles.recentSaleId}>
                    <MaterialIcons name="payment" size={16} color="#4CAF50" />{" "}
                    Payment #{payment.id}
                  </Text>
                  <Text style={[styles.recentSaleAmount, { color: "#4CAF50" }]}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
                <View style={styles.recentSaleDetails}>
                  <Text style={styles.recentSaleDate}>
                    {formatDate(payment.created_at || "")}
                  </Text>
                  <View
                    style={[
                      styles.recentSaleStatus,
                      { backgroundColor: "#E8F5E8" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.recentSaleStatusText,
                        { color: "#4CAF50" },
                      ]}
                    >
                      RECEIVED
                    </Text>
                  </View>
                </View>
                <View style={styles.recentSaleFooter}>
                  <Text style={styles.recentSaleCustomer}>
                    For Sale #{payment.sale_id} • {payment.payment_method}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* No Recent Activity */}
            {recentActivity.sales.length === 0 &&
              recentActivity.payments.length === 0 && (
                <View style={styles.noDataContainer}>
                  <MaterialIcons name="history" size={48} color="#CCCCCC" />
                  <Text style={styles.noDataText}>
                    No recent activity to display.
                  </Text>
                </View>
              )}
          </View>
        )}

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }}
        >
          <MaterialIcons name="logout" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sales Details Modal */}
      {renderDetailModal()}
    </>
  );
}

// Enhanced styles for the new dashboard
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F8F9FA",
  },
  errorText: {
    fontSize: 16,
    color: "#DC3545",
    textAlign: "center",
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  header: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  welcomeMessage: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  metricsContainer: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  cardContext: {
    fontSize: 12,
    color: "#6B7280",
  },
  cardIcon: {
    marginLeft: 12,
  },
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  tapHintText: {
    fontSize: 12,
    color: "#007AFF",
    marginRight: 4,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 16,
  },
  modalList: {
    paddingBottom: 20,
  },
  separator: {
    height: 12,
  },
  saleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  paymentStatus: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#10B981",
  },
  paymentStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 4,
    textTransform: "capitalize",
  },
  saleDetails: {
    marginBottom: 12,
  },
  customerName: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  balance: {
    fontSize: 14,
    fontWeight: "500",
    color: "#DC2626",
  },
  saleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  itemCount: {
    fontSize: 14,
    color: "#6B7280",
  },
  saleFooterActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  markPaidButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22C55E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  markPaidButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 4,
  },

  // Recent Activity styles
  recentActivityContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007AFF",
  },
  recentSaleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  recentPaymentCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  recentSaleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  recentSaleId: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
    flexDirection: "row",
    alignItems: "center",
  },
  recentSaleAmount: {
    fontSize: 16,
    fontWeight: "600",
  },
  recentSaleDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentSaleDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  recentSaleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recentSaleStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  recentSaleFooter: {
    marginTop: 8,
  },
  recentSaleCustomer: {
    fontSize: 14,
    color: "#6B7280",
  },
  recentSaleProducts: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  noDataContainer: {
    padding: 24,
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  // Logout button styles
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
