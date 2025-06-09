import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  getSaleDetails,
  updateSale,
  getSalePdfReceiptUrl,
  Sale,
  SaleItem,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { formatPrice } from "../../../utils/formatters";

export default function SalesSaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const saleData = await getSaleDetails(id as string);
      setSale(saleData);
    } catch (err: any) {
      console.error("Failed to fetch sale details:", err);
      setError(err.message || "Failed to load sale details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePaymentStatus = (newStatus: string) => {
    Alert.alert(
      "Update Payment Status",
      `Are you sure you want to mark this sale as ${newStatus}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const updatedSale = await updateSale(sale!.id, {
                payment_status: newStatus,
              });
              setSale(updatedSale);
              Alert.alert("Success", "Payment status updated successfully.");
            } catch (err: any) {
              console.error("Failed to update payment status:", err);
              Alert.alert(
                "Error",
                err.response?.data?.detail ||
                  err.message ||
                  "Failed to update payment status."
              );
            }
          },
        },
      ]
    );
  };

  const handleDownloadReceipt = async () => {
    try {
      // For web: direct download
      if (typeof window !== "undefined") {
        const url = getSalePdfReceiptUrl(id as string);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt_sale_${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For mobile: open in browser or external app
        const url = getSalePdfReceiptUrl(id as string);
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
        } else {
          Alert.alert("Error", "Cannot open PDF receipt");
        }
      }
    } catch (error: any) {
      console.error("Failed to download receipt:", error);
      Alert.alert("Error", "Failed to download receipt");
    }
  };

  const renderSaleItem = ({ item }: { item: any }) => (
    <View style={styles.saleItemRow}>
      <Text style={styles.itemName}>{item.product_name || item.name}</Text>
      <Text style={styles.itemDetails}>
        {item.quantity} × {formatPrice(item.price_at_sale)} ={" "}
        {formatPrice(item.subtotal)}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading sale details...</Text>
      </View>
    );
  }

  if (error || !sale) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || "Sale not found."}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Sale #${sale.id}` }} />

      {/* Sale Header */}
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>Sale #{sale.id}</Text>
        <Text style={styles.saleDate}>
          {sale.created_at
            ? new Date(sale.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unknown date"}
        </Text>
      </View>

      {/* Salesperson Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salesperson</Text>
        <Text style={styles.infoText}>
          {sale.salesperson_name || `User ID: ${sale.salesperson}`}
        </Text>
      </View>

      {/* Customer Information */}
      {(sale.customer_name || sale.customer_phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          {sale.customer_name && (
            <Text style={styles.infoText}>Name: {sale.customer_name}</Text>
          )}
          {sale.customer_phone && (
            <Text style={styles.infoText}>Phone: {sale.customer_phone}</Text>
          )}
        </View>
      )}

      {/* Products Sold */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products Sold</Text>
        <FlatList
          data={sale.items}
          renderItem={renderSaleItem}
          keyExtractor={(item, index) => `${item.product || "item"}-${index}`}
          scrollEnabled={false}
        />
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>
        <Text style={styles.infoText}>Method: {sale.payment_method}</Text>
        <Text style={styles.infoText}>Status: {sale.payment_status}</Text>
        <Text style={styles.totalAmount}>
          Total Amount: {formatPrice(sale.total_amount)}
        </Text>
        <Text style={styles.infoText}>
          Amount Paid: {formatPrice(sale.amount_paid)}
        </Text>
        {sale.balance && sale.balance > 0 && (
          <Text style={styles.balanceAmount}>
            Balance: {formatPrice(sale.balance)}
          </Text>
        )}
      </View>

      {/* Notes */}
      {sale.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.infoText}>{sale.notes}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Back to Sales</Text>
        </TouchableOpacity>

        {/* PDF Receipt Button - Available to all users */}
        <TouchableOpacity
          style={[styles.button, styles.pdfButton]}
          onPress={handleDownloadReceipt}
        >
          <Text style={styles.pdfButtonText}>Download Receipt</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  saleHeader: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
    alignItems: "center",
  },
  saleId: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  saleDate: {
    fontSize: 16,
    color: "#666666",
  },
  section: {
    backgroundColor: "#ffffff",
    marginTop: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e1e1",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: "#666666",
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#dc3545",
    marginBottom: 8,
  },
  saleItemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: "#666666",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#ffffff",
    marginTop: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    flex: 1,
    minWidth: 100,
  },
  backButton: {
    backgroundColor: "#6c757d",
  },
  pdfButton: {
    backgroundColor: "#17a2b8",
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  pdfButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
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
});
