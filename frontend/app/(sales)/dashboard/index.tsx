import React, { useEffect, useState } from 'react';
import { Text, View, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Button } from 'react-native';
// Removed Stack import as title is handled by _layout.tsx, useRouter may not be needed.
import { useAuth } from '../../../contexts/AuthContext'; // Adjust path as needed
import { getDashboardStats } from '../../../services/api'; // Adjust path

// Define the expected structure of Salesperson dashboard stats
interface SalespersonDashboardStats {
  my_sales_today: number;
  my_revenue_today: number;
  my_sales_this_month: number;
  my_revenue_this_month: number;
  my_pending_sales?: number;  // Optional based on API
  my_pending_amount?: number; // Optional based on API
  // Add other stats as per your API response for a salesperson
}

// MetricCard component (copied structure from Admin Dashboard for this task)
const MetricCard: React.FC<{ label: string; value: string | number; context?: string; icon?: React.ReactNode }> = ({ label, value, context, icon }) => (
  <View style={styles.card}>
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {context && <Text style={styles.cardContext}>{context}</Text>}
    </View>
    {icon || <View style={styles.cardIconPlaceholder}><Text style={styles.iconText}>📊</Text></View>}
  </View>
);

export default function SalespersonDashboardScreen() {
  const { user } = useAuth();

  const [stats, setStats] = useState<SalespersonDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalespersonStats = async () => {
    try {
      setError(null);
      // Assuming getDashboardStats() returns salesperson-specific data when called by a salesperson
      const data = await getDashboardStats();
      setStats(data as SalespersonDashboardStats); // Cast or validate structure if API returns different types
    } catch (err: any) {
      console.error("Failed to fetch salesperson dashboard stats:", err);
      setError(err.message || "Failed to fetch your dashboard data. Please try again.");
      setStats(null);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchSalespersonStats();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSalespersonStats();
  }, []);

  // Screen title is set in frontend/app/(sales)/dashboard/_layout.tsx

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Your Dashboard...</Text>
      </View>
    );
  }

  if (error && !stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.buttonSpacing}>
         <Button title="Retry" onPress={fetchSalespersonStats} color="#007AFF"/>
        </View>
      </View>
    );
  }

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number') return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#007AFF"]}/>}
    >
      <Text style={styles.welcomeMessage}>Welcome back, {user?.email || 'Salesperson'}!</Text>
      {error && <Text style={[styles.errorText, {marginBottom: 10}]}>Error: {error}</Text>}

      {stats ? (
        <>
          <MetricCard
            label="My Revenue Today"
            value={formatCurrency(stats.my_revenue_today)}
          />
          <MetricCard
            label="My Sales Today"
            value={stats.my_sales_today?.toString() || '0'}
          />
          <MetricCard
            label="My Revenue This Month"
            value={formatCurrency(stats.my_revenue_this_month)}
          />
          <MetricCard
            label="My Sales This Month"
            value={stats.my_sales_this_month?.toString() || '0'}
          />
          {stats.my_pending_sales !== undefined && (
            <MetricCard label="My Pending Sales (Count)" value={stats.my_pending_sales.toString()} />
          )}
          {stats.my_pending_amount !== undefined && (
            <MetricCard label="My Pending Sales (Amount)" value={formatCurrency(stats.my_pending_amount)} />
          )}
        </>
      ) : (
        !isLoading && <Text style={styles.noDataText}>No dashboard data available for you at the moment.</Text>
      )}
    </ScrollView>
  );
}

// Styles (adapted from Admin Dashboard styles)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: '#60758a',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111418',
  },
  cardContext: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  cardIconPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: '#E0F2F7', // Different color for Salesperson dashboard icon bg
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconText: { // Simple text as icon placeholder
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataText: {
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    color: '#666',
  },
  buttonSpacing: {
      marginTop: 10,
  }
});
