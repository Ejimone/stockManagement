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
  displayPdfReceipt,
  updateSalePaymentStatus,
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

  const handleMarkAsPaid = async () => {
    if (!sale) return;

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
                setIsLoading(true);
                const response = await updateSalePaymentStatus(sale.id);

                // Update the sale in the local state
                setSale(response.sale);

                Alert.alert("Success", "Sale marked as paid successfully!");
              } catch (error: any) {
                console.error("Failed to update payment status:", error);
                Alert.alert(
                  "Error",
                  error.response?.data?.error ||
                    "Failed to update payment status. Please try again."
                );
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error in handleMarkAsPaid:", error);
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

  return (
    <ScrollView style={styles.container}>
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

        {/* Mark as Paid Button - Debug version always visible */}
        <TouchableOpacity
          style={[
            styles.markPaidButton,
            {
              backgroundColor:
                sale.payment_status?.toLowerCase() === "partial" ||
                sale.payment_status?.toLowerCase() === "unpaid"
                  ? "#22c55e"
                  : "#6b7280",
              marginTop: 16,
              opacity:
                sale.payment_status?.toLowerCase() === "partial" ||
                sale.payment_status?.toLowerCase() === "unpaid"
                  ? 1
                  : 0.6,
            },
          ]}
          onPress={
            sale.payment_status?.toLowerCase() === "partial" ||
            sale.payment_status?.toLowerCase() === "unpaid"
              ? handleMarkAsPaid
              : undefined
          }
          activeOpacity={
            sale.payment_status?.toLowerCase() === "partial" ||
            sale.payment_status?.toLowerCase() === "unpaid"
              ? 0.8
              : 1
          }
          disabled={
            !(
              sale.payment_status?.toLowerCase() === "partial" ||
              sale.payment_status?.toLowerCase() === "unpaid"
            )
          }
        >
          <Text style={styles.markPaidButtonText}>
            {sale.payment_status?.toLowerCase() === "partial" ||
            sale.payment_status?.toLowerCase() === "unpaid"
              ? "✓ Mark as Paid Completed"
              : `Current Status: ${sale.payment_status}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notes */}
      {sale.notes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.infoText}>{sale.notes}</Text>
        </View>
      )}

      {/* Receipt Preview */}
      <View style={styles.receiptSection}>
        <Text style={styles.sectionTitle}>Receipt Preview</Text>
        <View style={styles.receiptContainer}>
          {/* Receipt Header */}
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>SALE RECEIPT</Text>
            <Text style={styles.receiptId}>Receipt #{sale.id}</Text>
            <Text style={styles.receiptDate}>
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

          {/* Receipt Body */}
          <View style={styles.receiptBody}>
            {/* Customer Info */}
            {(sale.customer_name || sale.customer_phone) && (
              <View style={styles.receiptCustomer}>
                <Text style={styles.receiptLabel}>CUSTOMER:</Text>
                {sale.customer_name && (
                  <Text style={styles.receiptValue}>{sale.customer_name}</Text>
                )}
                {sale.customer_phone && (
                  <Text style={styles.receiptValue}>{sale.customer_phone}</Text>
                )}
              </View>
            )}

            {/* Salesperson */}
            <View style={styles.receiptSalesperson}>
              <Text style={styles.receiptLabel}>SERVED BY:</Text>
              <Text style={styles.receiptValue}>
                {sale.salesperson_name || `Staff ID: ${sale.salesperson}`}
              </Text>
            </View>

            {/* Items */}
            <View style={styles.receiptItems}>
              <Text style={styles.receiptLabel}>ITEMS:</Text>
              <View style={styles.receiptItemsHeader}>
                <Text style={styles.receiptItemHeaderText}>Item</Text>
                <Text style={styles.receiptItemHeaderText}>Qty</Text>
                <Text style={styles.receiptItemHeaderText}>Price</Text>
                <Text style={styles.receiptItemHeaderText}>Total</Text>
              </View>
              {sale.items?.map((item, index) => (
                <View key={index} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName}>
                    {item.product_name || `Product ${item.product}`}
                  </Text>
                  <Text style={styles.receiptItemQty}>{item.quantity}</Text>
                  <Text style={styles.receiptItemPrice}>
                    {formatPrice(item.price_at_sale)}
                  </Text>
                  <Text style={styles.receiptItemTotal}>
                    {formatPrice(item.subtotal)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals */}
            <View style={styles.receiptTotals}>
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>SUBTOTAL:</Text>
                <Text style={styles.receiptTotalValue}>
                  {formatPrice(sale.total_amount)}
                </Text>
              </View>
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>AMOUNT PAID:</Text>
                <Text style={styles.receiptTotalValue}>
                  {formatPrice(sale.amount_paid)}
                </Text>
              </View>
              {sale.balance && sale.balance > 0 && (
                <View style={styles.receiptTotalRow}>
                  <Text
                    style={[styles.receiptTotalLabel, styles.receiptBalance]}
                  >
                    BALANCE DUE:
                  </Text>
                  <Text
                    style={[styles.receiptTotalValue, styles.receiptBalance]}
                  >
                    {formatPrice(sale.balance)}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment Method */}
            <View style={styles.receiptPayment}>
              <Text style={styles.receiptLabel}>PAYMENT METHOD:</Text>
              <Text style={styles.receiptValue}>{sale.payment_method}</Text>
              <Text style={styles.receiptLabel}>STATUS:</Text>
              <Text
                style={[
                  styles.receiptValue,
                  sale.payment_status === "paid"
                    ? styles.receiptPaid
                    : sale.payment_status === "partial"
                    ? styles.receiptPartial
                    : styles.receiptUnpaid,
                ]}
              >
                {sale.payment_status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Receipt Footer */}
          <View style={styles.receiptFooter}>
            <Text style={styles.receiptThankYou}>
              Thank you for your business!
            </Text>
            <Text style={styles.receiptFooterText}>
              This is a valid receipt for your purchase
            </Text>
          </View>
        </View>
      </View>

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
  // Receipt Preview Styles
  receiptSection: {
    backgroundColor: "#ffffff",
    marginTop: 12,
    padding: 16,
  },
  receiptContainer: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 8,
    padding: 20,
    marginTop: 8,
  },
  receiptHeader: {
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#333333",
    paddingBottom: 16,
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  receiptId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 4,
  },
  receiptDate: {
    fontSize: 14,
    color: "#666666",
  },
  receiptBody: {
    marginBottom: 16,
  },
  receiptCustomer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  receiptSalesperson: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  receiptValue: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 2,
  },
  receiptItems: {
    marginBottom: 16,
  },
  receiptItemsHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#333333",
    paddingBottom: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  receiptItemHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
  },
  receiptItemRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  receiptItemName: {
    flex: 2,
    fontSize: 12,
    color: "#333333",
    paddingRight: 4,
  },
  receiptItemQty: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
  },
  receiptItemPrice: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
  },
  receiptItemTotal: {
    flex: 1,
    fontSize: 12,
    color: "#333333",
    textAlign: "center",
    fontWeight: "600",
  },
  receiptTotals: {
    borderTopWidth: 2,
    borderTopColor: "#333333",
    paddingTop: 12,
    marginBottom: 12,
  },
  receiptTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  receiptTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  receiptBalance: {
    color: "#dc3545",
    fontSize: 16,
  },
  receiptPayment: {
    borderTopWidth: 1,
    borderTopColor: "#e1e1e1",
    paddingTop: 12,
    marginBottom: 12,
  },
  receiptPaid: {
    color: "#28a745",
    fontWeight: "bold",
  },
  receiptPartial: {
    color: "#ffc107",
    fontWeight: "bold",
  },
  receiptUnpaid: {
    color: "#dc3545",
    fontWeight: "bold",
  },
  receiptFooter: {
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#333333",
    paddingTop: 16,
  },
  receiptThankYou: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  receiptFooterText: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
  },
  markPaidButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  markPaidButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});
