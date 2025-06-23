import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Button,
  Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext"; // Adjust path as needed
import { getDashboardStats } from "../../../services/api"; // Adjust path
import { usePaymentNotifications } from "../../../hooks/usePaymentNotifications";
import { PaymentNotification } from "../../../services/notificationService";
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Define the expected structure of dashboard stats
interface DashboardStats {
  total_sales_this_month: number;
  total_revenue_this_month: number;
  total_salespersons: number;
  low_stock_products: number;
  total_products?: number;
  out_of_stock_products?: number;
  pending_payments?: number;
  // Add other stats as per your API response
}

// Card component for displaying a single metric
const MetricCard: React.FC<{
  label: string;
  value: string | number;
  context?: string;
  icon?: React.ReactNode;
}> = ({ label, value, context, icon }) => (
  <View style={styles.card}>
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {context && <Text style={styles.cardContext}>{context}</Text>}
    </View>
    {icon ? <View style={styles.cardIcon}>{icon}</View> : null}
  </View>
);

export default function AdminDashboardScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter(); // For potential actions or navigation

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Real-time payment notifications are currently disabled
  const { isPolling } = usePaymentNotifications({
    enabled: false, // Explicitly disable
    showAlert: false,
    onNewPayment: () => {
      // No-op since notifications are disabled
    },
  });

  const fetchStats = async () => {
    try {
      console.log("Admin dashboard: Attempting to fetch stats");
      setError(null); // Clear previous errors
      const data = await getDashboardStats();
      console.log("Admin dashboard: Stats fetched successfully:", data);
      setStats(data);
    } catch (err: any) {
      console.error("Failed to fetch dashboard stats:", err);

      // Provide more detailed error information
      let errorMessage = "Failed to fetch dashboard data. Please try again.";

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
      setStats(null); // Clear stats on error
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  // The screen title is set in the _layout.tsx for this stack.
  // <Stack.Screen options={{ title: 'Admin Dashboard' }} />
  // This is already handled by frontend/app/(admin)/dashboard/_layout.tsx

  if (isLoading && !refreshing) {
    // Show full page loader only on initial load
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Dashboard...</Text>
      </View>
    );
  }

  if (error && !stats) {
    // Show error only if no stats are available (e.g. initial load failed)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.buttonSpacing}>
          <Button title="Retry" onPress={fetchStats} color="#007AFF" />
        </View>
      </View>
    );
  }

  // Helper to format currency - adapt as needed
  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== "number") return "N/A";
    return `₦${value.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#007AFF"]}
        />
      }
    >
      <Text style={styles.welcomeMessage}>{user?.email || "Admin"}!</Text>

      {/* Real-time notification status */}
      <View style={styles.notificationStatus}>
        <Text style={styles.notificationText}>
          {/* 🔔 Real-time Notifications: 🔴 Disabled (temporarily) */}
        </Text>
      </View>

      {error && (
        <Text style={[styles.errorText, { marginBottom: 10 }]}>
          Error: {error} (Retrying might show cached data or new data)
        </Text>
      )}

      {stats ? (
        <>
          <MetricCard
            label="Revenue This Month"
            value={formatCurrency(stats.total_revenue_this_month)}
            context="Based on completed sales"
            icon={
              <MaterialIcons name="attach-money" size={32} color="#2E7D32" />
            }
          />
          <MetricCard
            label="Sales This Month"
            value={stats.total_sales_this_month?.toString() || "0"}
            context="Total number of sales recorded"
            icon={
              <MaterialCommunityIcons
                name="cart-outline"
                size={32}
                color="#1565C0"
              />
            }
          />
          <MetricCard
            label="Active Salespersons"
            value={stats.total_salespersons?.toString() || "0"}
            icon={<MaterialIcons name="people" size={32} color="#6A1B9A" />}
          />
          <MetricCard
            label="Low Stock Items"
            value={stats.low_stock_products?.toString() || "0"}
            context="Products needing attention"
            icon={<MaterialIcons name="warning" size={32} color="#FF8F00" />}
          />
          {stats.total_products !== undefined && (
            <MetricCard
              label="Total Products"
              value={stats.total_products.toString()}
              icon={
                <MaterialIcons name="inventory" size={32} color="#0277BD" />
              }
            />
          )}
          {stats.out_of_stock_products !== undefined && (
            <MetricCard
              label="Out of Stock Products"
              value={stats.out_of_stock_products.toString()}
              icon={
                <MaterialIcons name="highlight-off" size={32} color="#D32F2F" />
              }
            />
          )}
          {stats.pending_payments !== undefined && (
            <MetricCard
              label="Pending Payments Value"
              value={formatCurrency(stats.pending_payments)}
              context="Total from unpaid sales"
              icon={
                <FontAwesome name="credit-card" size={30} color="#F57C00" />
              }
            />
          )}
        </>
      ) : (
        !isLoading && (
          <Text style={styles.noDataText}>
            No dashboard data available at the moment.
          </Text>
        )
      )}
      <View style={styles.buttonContainer}>
        <Button
          title="Logout"
          onPress={async () => {
            try {
              await signOut();
              router.replace("/(auth)/login");
            } catch (error) {
              console.error("Logout failed:", error);
            }
          }}
          color="#ff3b30"
        />
      </View>
    </ScrollView>
  );
}

// Button is now imported at the top of the file

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5", // Light grey background
  },
  scrollView: {
    // This style is not directly used on ScrollView tag, but good to keep if refactoring
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  notificationStatus: {
    backgroundColor: "#F0F8FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  notificationText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8, // Replaced marginBottom with marginVertical for even spacing
    marginHorizontal: 16, // Added horizontal margin
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 }, // Softer shadow
    shadowOpacity: 0.08, // Reduced opacity
    shadowRadius: 3, // Reduced radius
    elevation: 2, // Softer elevation for Android
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: "#60758a",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22, // Slightly larger for emphasis
    fontWeight: "bold",
    color: "#111418",
  },
  cardContext: {
    fontSize: 12,
    color: "#777", // Slightly darker for better readability
    marginTop: 4, // Added top margin
  },
  cardIconPlaceholder: {
    width: 48, // Adjusted size
    height: 48, // Adjusted size
    backgroundColor: "#E8EAF6", // Lighter, more neutral placeholder color
    borderRadius: 24, // Keep it circular
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12, // Added margin to separate from text
    // This style will now be used only as a fallback
  },
  cardIcon: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    borderRadius: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20, // Increased padding
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 12, // Added margin for spacing from button
  },
  noDataText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#666",
  },
  buttonContainer: {
    // For the test logout button
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30, // Ensure it's visible if content is short
  },
  buttonSpacing: {
    // For Retry button
    marginTop: 10,
  },
});
