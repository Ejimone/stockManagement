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
import { LineChart, BarChart } from "react-native-chart-kit";
import { useAuth } from "../../../contexts/AuthContext";
import { getComprehensiveReports } from "../../../services/api";
import { formatCurrency, formatDate } from "../../../utils/formatters";

const { width: screenWidth } = Dimensions.get("window");

interface ChartDataPoint {
  date: string;
  sales_amount: number;
  sales_count: number;
}

interface ReportsData {
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
  inventory_status: {
    total_products: number;
    out_of_stock: number;
    low_stock: number;
    in_stock: number;
    low_stock_items: Array<{
      id: number;
      name: string;
      sku: string;
      stock_quantity: number;
      price: number;
    }>;
    out_of_stock_items: Array<{
      id: number;
      name: string;
      sku: string;
      price: number;
    }>;
  };
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
  period: {
    from: string;
    to: string;
  };
}

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
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
          <Text style={styles.sectionTitle}>Sales Trend</Text>
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
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Daily Sales Trend</Text>
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
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "4",
              strokeWidth: "2",
              stroke: "#22c55e",
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

    const { sales_summary, inventory_status, credit_summary } = reportsData;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.sectionTitle}>Summary</Text>
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

          <View style={[styles.summaryCard, styles.inventoryCard]}>
            <Text style={styles.summaryCardTitle}>Products</Text>
            <Text style={styles.summaryCardValue}>
              {inventory_status.total_products}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {inventory_status.low_stock + inventory_status.out_of_stock}{" "}
              alerts
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.paymentsCard]}>
            <Text style={styles.summaryCardTitle}>Outstanding</Text>
            <Text style={styles.summaryCardValue}>
              {credit_summary.total_unpaid_sales +
                credit_summary.total_partial_sales}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {formatCurrency(credit_summary.total_outstanding_balance)}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.profitCard]}>
            <Text style={styles.summaryCardTitle}>Paid Amount</Text>
            <Text style={styles.summaryCardValue}>
              {formatCurrency(sales_summary.total_paid)}
            </Text>
            <Text style={styles.summaryCardSubtitle}>
              {(
                (sales_summary.total_paid / sales_summary.total_revenue) *
                100
              ).toFixed(1)}
              % of total
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderInventoryStatus = () => {
    if (!reportsData?.inventory_status) return null;

    const { inventory_status } = reportsData;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Inventory Status</Text>

        <View style={styles.inventoryStats}>
          <View style={styles.inventoryStatItem}>
            <View
              style={[styles.statIndicator, { backgroundColor: "#ef4444" }]}
            />
            <Text style={styles.statLabel}>Out of Stock</Text>
            <Text style={styles.statValue}>
              {inventory_status.out_of_stock}
            </Text>
          </View>
          <View style={styles.inventoryStatItem}>
            <View
              style={[styles.statIndicator, { backgroundColor: "#f59e0b" }]}
            />
            <Text style={styles.statLabel}>Low Stock</Text>
            <Text style={styles.statValue}>{inventory_status.low_stock}</Text>
          </View>
          <View style={styles.inventoryStatItem}>
            <View
              style={[styles.statIndicator, { backgroundColor: "#22c55e" }]}
            />
            <Text style={styles.statLabel}>In Stock</Text>
            <Text style={styles.statValue}>{inventory_status.in_stock}</Text>
          </View>
        </View>

        {inventory_status.low_stock_items.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertTitle}>Low Stock Items</Text>
            {inventory_status.low_stock_items.map((item) => (
              <View key={item.id} style={styles.alertItem}>
                <View style={styles.alertItemInfo}>
                  <Text style={styles.alertItemName}>{item.name}</Text>
                  <Text style={styles.alertItemDetails}>
                    SKU: {item.sku} • {formatCurrency(item.price)}
                  </Text>
                </View>
                <View style={styles.alertItemStock}>
                  <Text style={styles.alertItemStockText}>
                    {item.stock_quantity}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {inventory_status.out_of_stock_items.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertTitle}>Out of Stock Items</Text>
            {inventory_status.out_of_stock_items.map((item) => (
              <View key={item.id} style={styles.alertItem}>
                <View style={styles.alertItemInfo}>
                  <Text style={styles.alertItemName}>{item.name}</Text>
                  <Text style={styles.alertItemDetails}>
                    SKU: {item.sku} • {formatCurrency(item.price)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.alertItemStock,
                    { backgroundColor: "#fee2e2" },
                  ]}
                >
                  <Text
                    style={[styles.alertItemStockText, { color: "#dc2626" }]}
                  >
                    0
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCreditSummary = () => {
    if (!reportsData?.credit_summary) return null;

    const { credit_summary } = reportsData;

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Credits & Outstanding Payments</Text>

        <View style={styles.creditStats}>
          <Text style={styles.creditStatsText}>
            Total Outstanding:{" "}
            {formatCurrency(credit_summary.total_outstanding_balance)}
          </Text>
          <Text style={styles.creditStatsText}>
            Unpaid Sales: {credit_summary.total_unpaid_sales} • Partial
            Payments: {credit_summary.total_partial_sales}
          </Text>
        </View>

        {credit_summary.unpaid_sales.length > 0 && (
          <View style={styles.creditSection}>
            <Text style={styles.creditSectionTitle}>Unpaid Sales</Text>
            {credit_summary.unpaid_sales.map((sale) => (
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
            {credit_summary.partial_sales.map((sale) => (
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
        <Text style={styles.sectionTitle}>Top Selling Products</Text>
        {reportsData.top_products.map((product, index) => (
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
      {renderPeriodSelector()}
      {renderSalesChart()}
      {renderSummaryCards()}
      {renderInventoryStatus()}
      {renderCreditSummary()}
      {renderTopProducts()}
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
  inventoryCard: {
    backgroundColor: "#dcfce7",
  },
  paymentsCard: {
    backgroundColor: "#fed7d7",
  },
  profitCard: {
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
  inventoryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
  },
  inventoryStatItem: {
    alignItems: "center",
  },
  statIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  alertSection: {
    marginTop: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc2626",
    marginBottom: 8,
  },
  alertItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  alertItemInfo: {
    flex: 1,
  },
  alertItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
  },
  alertItemDetails: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  alertItemStock: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  alertItemStockText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#92400e",
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
});
