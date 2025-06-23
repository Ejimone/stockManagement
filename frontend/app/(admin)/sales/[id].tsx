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
  deleteSale,
  updateSale,
  displayPdfReceipt,
  Sale,
  SaleItem,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { formatPrice } from "../../../utils/formatters";

export default function AdminSaleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleDeleteSale = () => {
    if (!sale) return;

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete Sale #${sale.id}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteSale(sale.id);
              Alert.alert("Success", "Sale deleted successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              console.error("Failed to delete sale:", err);
              Alert.alert(
                "Error",
                err.response?.data?.detail ||
                  err.message ||
                  "Failed to delete sale."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePaymentStatus = (newStatus: string) => {
    if (!sale || user?.role !== "Admin") return;

    Alert.alert(
      "Update Payment Status",
      `Change payment status to "${newStatus}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: async () => {
            try {
              const updatedSale = await updateSale(sale.id, {
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
      await displayPdfReceipt(id as string);
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

  const saleDate = sale.created_at ? new Date(sale.created_at) : null;
  const saleItems = sale.items || sale.products_sold || [];

  return (
    <ScrollView style={styles.container}>
      {/* Sale Header */}
      <View style={styles.saleHeader}>
        <Text style={styles.saleId}>Sale #{sale.id}</Text>
        <Text style={styles.saleDate}>
          {saleDate
            ? saleDate.toLocaleDateString() +
              " " +
              saleDate.toLocaleTimeString()
            : "N/A"}
        </Text>
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information</Text>
        <Text style={styles.infoText}>
          Name: {sale.customer_name || "Walk-in Customer"}
        </Text>
        {sale.customer_phone && (
          <Text style={styles.infoText}>Phone: {sale.customer_phone}</Text>
        )}
      </View>

      {/* Salesperson Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salesperson</Text>
        <Text style={styles.infoText}>{sale.salesperson_name}</Text>
      </View>

      {/* Products Sold */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Products Sold</Text>
        {saleItems.length > 0 ? (
          <FlatList
            data={saleItems}
            renderItem={renderSaleItem}
            keyExtractor={(item, index) => `item-${index}`}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.infoText}>No items found</Text>
        )}
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

        {/* Payment Status Update Buttons (Admin Only) */}
        {user?.role === "Admin" && sale.payment_status !== "Paid" && (
          <View style={styles.paymentActions}>
            <Text style={styles.actionLabel}>Update Payment Status:</Text>
            <View style={styles.statusButtons}>
              {sale.payment_status !== "Partial" && (
                <TouchableOpacity
                  style={[styles.statusButton, styles.partialButton]}
                  onPress={() => handleUpdatePaymentStatus("Partial")}
                >
                  <Text style={styles.statusButtonText}>Mark as Partial</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.statusButton, styles.paidButton]}
                onPress={() => handleUpdatePaymentStatus("Paid")}
              >
                <Text style={styles.statusButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
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
          disabled={isDeleting}
        >
          <Text style={styles.backButtonText}>Back to Sales</Text>
        </TouchableOpacity>

        {/* PDF Receipt Button - Available to all users */}
        <TouchableOpacity
          style={[styles.button, styles.pdfButton]}
          onPress={handleDownloadReceipt}
          disabled={isDeleting}
        >
          <Text style={styles.pdfButtonText}>Download Receipt</Text>
        </TouchableOpacity>

        {user?.role === "Admin" && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.deleteButton,
              isDeleting && styles.disabledButton,
            ]}
            onPress={handleDeleteSale}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Sale</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 50, // Added top margin for header-less pages
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
  paymentActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: "row",
    gap: 12,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  partialButton: {
    backgroundColor: "#fd7e14",
  },
  paidButton: {
    backgroundColor: "#28a745",
  },
  statusButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
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
  deleteButton: {
    backgroundColor: "#dc3545",
  },
  pdfButton: {
    backgroundColor: "#17a2b8",
  },
  disabledButton: {
    opacity: 0.6,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  deleteButtonText: {
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
