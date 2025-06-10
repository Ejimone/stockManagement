import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Stack } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext";
import { getComprehensiveReports } from "../../../services/api";
import { formatCurrency, formatDate } from "../../../utils/formatters";

const { width: screenWidth } = Dimensions.get("window");

interface ChartDataPoint {
  date: string;
  sales_amount: number;
  sales_count: number;
}

interface SalesReportsData {
  chart_data: ChartDataPoint[];
  sales_summary: {
    total_sales: number;
    total_revenue: number;
    total_paid: number;
    total_balance: number;
  };
  payment_status_breakdown: Array<{
    payment_status: string;
    count: number;
    total: number;
  }>;
  top_products: Array<{
    product__name: string;
    product__sku: string;
    product__price: number;
    total_quantity: number;
    total_revenue: number;
  }>;
  credit_summary: {
    total_unpaid_sales: number;
    total_partial_sales: number;
    total_outstanding_balance: number;
    unpaid_sales: Array<{
      id: number;
      customer_name: string;
      customer_phone: string;
      total_amount: number;
      balance: number;
      created_at: string;
    }>;
    partial_sales: Array<{
      id: number;
      customer_name: string;
      customer_phone: string;
      total_amount: number;
      amount_paid: number;
      balance: number;
      created_at: string;
    }>;
  };
  recent_activity: {
    sales: Array<{
      id: number;
      customer_name: string;
      total_amount: number;
      payment_status: string;
      created_at: string;
    }>;
    payments: Array<{
      id: number;
      sale__customer_name: string;
      amount: number;
      payment_method: string;
      created_at: string;
    }>;
  };
  period: {
    from: string;
    to: string;
  };
}

export default function SalesMyReportsScreen() {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState<SalesReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  const fetchReports = async (period: string = "30") => {
    try {
      setLoading(true);
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - parseInt(period));

      const params = {
        date_from: fromDate.toISOString().split("T")[0],
        date_to: today.toISOString().split("T")[0],
      };

      const data = await getComprehensiveReports(params);
      setReportsData(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      Alert.alert("Error", "Failed to load reports data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedPeriod);
  }, [selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports(selectedPeriod);
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <Text style={styles.sectionTitle}>Time Period</Text>
      <View style={styles.periodButtons}>
        {["7", "30", "90"].map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.selectedPeriodButton,
            ]}
            onPress={() => handlePeriodChange(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.selectedPeriodButtonText,
              ]}
            >
              {period} Days
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSalesChart = () => {
    if (!reportsData?.chart_data || reportsData.chart_data.length === 0) {
      return (
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>My Sales Trend</Text>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No sales data available</Text>
          </View>
        </View>
      );
    }

    const chartData = {
      labels: reportsData.chart_data.map((item) => {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: reportsData.chart_data.map((item) => item.sales_amount),
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>My Daily Sales Performance</Text>
        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          yAxisLabel="₦"
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#3b82f6",
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderSummaryCards = () => {
    if (!reportsData) return null;

    const { sales_summary, credit_summary } = reportsData;
    const collectionRate =
      sales_summary.total_revenue > 0
        ? (
            (sales_summary.total_paid / sales_summary.total_revenue) *
            100
          ).toFixed(1)
        : "0";

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>My Performance Summary</Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.salesCard]}>
            <Text style={styles.summaryCardTitle}>Total Sales</Text>
            <Text style={styles.summaryCardValue}>
              {sales_summary.total_sales}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {formatCurrency(sales_summary.total_revenue)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.paymentsCard]}>
            <Text style={styles.summaryCardTitle}>Collected</Text>
            <Text style={styles.summaryCardValue}>
              {formatCurrency(sales_summary.total_paid)}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {collectionRate}% collection rate
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.creditCard]}>
            <Text style={styles.summaryCardTitle}>Outstanding</Text>
            <Text style={styles.summaryCardValue}>
              {credit_summary.total_unpaid_sales +
                credit_summary.total_partial_sales}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {formatCurrency(credit_summary.total_outstanding_balance)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.averageCard]}>
            <Text style={styles.summaryCardTitle}>Average Sale</Text>
            <Text style={styles.summaryCardValue}>
              {formatCurrency(
                sales_summary.total_sales > 0
                  ? sales_summary.total_revenue / sales_summary.total_sales
                  : 0
              )}
            </Text>
            <Text style={styles.summaryCardSubtitle}>per transaction</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderPaymentStatusBreakdown = () => {
    if (!reportsData?.payment_status_breakdown) return null;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Payment Status Breakdown</Text>
        {reportsData.payment_status_breakdown.map((status) => (
          <View key={status.payment_status} style={styles.statusItem}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusName}>
                {status.payment_status.charAt(0).toUpperCase() +
                  status.payment_status.slice(1)}
              </Text>
              <Text style={styles.statusDetails}>
                {status.count} sales • {formatCurrency(status.total)}
              </Text>
            </View>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor:
                    status.payment_status === "paid"
                      ? "#22c55e"
                      : status.payment_status === "partial"
                      ? "#f59e0b"
                      : "#ef4444",
                },
              ]}
            >
              <Text style={styles.statusCount}>{status.count}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderCreditSummary = () => {
    if (!reportsData?.credit_summary) return null;

    const { credit_summary } = reportsData;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>My Credit Sales</Text>

        <View style={styles.creditStats}>
          <Text style={styles.creditStatsText}>
            Total Outstanding:{" "}
            {formatCurrency(credit_summary.total_outstanding_balance)}
          </Text>
          <Text style={styles.creditStatsText}>
            Unpaid: {credit_summary.total_unpaid_sales} • Partial:{" "}
            {credit_summary.total_partial_sales}
          </Text>
        </View>

        {credit_summary.unpaid_sales.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditSectionTitle}>Unpaid Sales</Text>
            {credit_summary.unpaid_sales.slice(0, 5).map((sale) => (
              <View key={sale.id} style={styles.creditItem}>
                <View style={styles.creditItemInfo}>
                  <Text style={styles.creditItemCustomer}>
                    {sale.customer_name}
                  </Text>
                  <Text style={styles.creditItemDetails}>
                    {formatDate(sale.created_at)} • {sale.customer_phone}
                  </Text>
                </View>
                <View style={styles.creditItemAmount}>
                  <Text style={styles.creditItemAmountText}>
                    {formatCurrency(sale.balance)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {credit_summary.partial_sales.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditSectionTitle}>Partial Payments</Text>
            {credit_summary.partial_sales.slice(0, 5).map((sale) => (
              <View key={sale.id} style={styles.creditItem}>
                <View style={styles.creditItemInfo}>
                  <Text style={styles.creditItemCustomer}>
                    {sale.customer_name}
                  </Text>
                  <Text style={styles.creditItemDetails}>
                    {formatDate(sale.created_at)} • Paid:{" "}
                    {formatCurrency(sale.amount_paid)}
                  </Text>
                </View>
                <View style={styles.creditItemAmount}>
                  <Text style={styles.creditItemAmountText}>
                    {formatCurrency(sale.balance)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderTopProducts = () => {
    if (!reportsData?.top_products || reportsData.top_products.length === 0)
      return null;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>My Top Selling Products</Text>
        {reportsData.top_products.slice(0, 5).map((product, index) => (
          <View key={product.product__sku} style={styles.topProductItem}>
            <View style={styles.topProductRank}>
              <Text style={styles.topProductRankText}>{index + 1}</Text>
            </View>
            <View style={styles.topProductInfo}>
              <Text style={styles.topProductName}>{product.product__name}</Text>
              <Text style={styles.topProductDetails}>
                SKU: {product.product__sku} •{" "}
                {formatCurrency(product.product__price)}
              </Text>
            </View>
            <View style={styles.topProductStats}>
              <Text style={styles.topProductQuantity}>
                {product.total_quantity} sold
              </Text>
              <Text style={styles.topProductRevenue}>
                {formatCurrency(product.total_revenue)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderRecentActivity = () => {
    if (!reportsData?.recent_activity) return null;

    const { recent_activity } = reportsData;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {recent_activity.sales.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.activitySectionTitle}>Recent Sales</Text>
            {recent_activity.sales.map((sale) => (
              <View key={sale.id} style={styles.activityItem}>
                <View style={styles.activityItemInfo}>
                  <Text style={styles.activityItemTitle}>
                    {sale.customer_name}
                  </Text>
                  <Text style={styles.activityItemDetails}>
                    {formatDate(sale.created_at)} • {sale.payment_status}
                  </Text>
                </View>
                <Text style={styles.activityItemAmount}>
                  {formatCurrency(sale.total_amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {recent_activity.payments.length > 0 && (
          <View style={styles.activitySection}>
            <Text style={styles.activitySectionTitle}>Recent Payments</Text>
            {recent_activity.payments.map((payment) => (
              <View key={payment.id} style={styles.activityItem}>
                <View style={styles.activityItemInfo}>
                  <Text style={styles.activityItemTitle}>
                    {payment.sale__customer_name}
                  </Text>
                  <Text style={styles.activityItemDetails}>
                    {formatDate(payment.created_at)} • {payment.payment_method}
                  </Text>
                </View>
                <Text style={[styles.activityItemAmount, { color: "#22c55e" }]}>
                  +{formatCurrency(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: "My Reports" }} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Stack.Screen options={{ title: "My Reports" }} />
      {renderPeriodSelector()}
      {renderSalesChart()}
      {renderSummaryCards()}
      {renderPaymentStatusBreakdown()}
      {renderCreditSummary()}
      {renderTopProducts()}
      {renderRecentActivity()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
  },
  periodSelector: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  periodButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedPeriodButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  periodButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  selectedPeriodButtonText: {
    color: "#ffffff",
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
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
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryCard: {
    width: "48%",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  salesCard: {
    backgroundColor: "#dbeafe",
  },
  paymentsCard: {
    backgroundColor: "#dcfce7",
  },
  creditCard: {
    backgroundColor: "#fed7d7",
  },
  averageCard: {
    backgroundColor: "#fef3c7",
  },
  summaryCardTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  summaryCardSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  reportSection: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 16,
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
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  statusInfo: {
    flex: 1,
  },
  statusName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  statusDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusCount: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#ffffff",
  },
  creditStats: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  creditStatsText: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 4,
  },
  creditSection: {
    marginTop: 16,
  },
  creditSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 8,
  },
  creditItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  creditItemInfo: {
    flex: 1,
  },
  creditItemCustomer: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  creditItemDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  creditItemAmount: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  creditItemAmountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc2626",
  },
  topProductItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  topProductRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  topProductRankText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ffffff",
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  topProductDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  topProductStats: {
    alignItems: "flex-end",
  },
  topProductQuantity: {
    fontSize: 12,
    color: "#6b7280",
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  activitySection: {
    marginTop: 16,
  },
  activitySectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b82f6",
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  activityItemInfo: {
    flex: 1,
  },
  activityItemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  activityItemDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  activityItemAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
  },
});
