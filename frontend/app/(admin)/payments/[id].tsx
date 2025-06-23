import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getPaymentDetails,
  updatePayment,
  displayPdfReceipt,
  Payment,
} from "../../../services/api";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit form states
  const [editAmount, setEditAmount] = useState("");
  const [editMethod, setEditMethod] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (id) {
      loadPaymentDetails();
    }
  }, [id]);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const paymentData = await getPaymentDetails(id!);
      setPayment(paymentData);

      // Set edit form values
      setEditAmount(paymentData.amount.toString());
      setEditMethod(paymentData.payment_method);
      setEditReference(paymentData.reference_number || "");
      setEditStatus(paymentData.status);
      setEditNotes(paymentData.notes || "");
    } catch (error) {
      console.error("Error loading payment details:", error);
      Alert.alert("Error", "Failed to load payment details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    try {
      if (!payment) return;

      const updateData = {
        amount: parseFloat(editAmount),
        payment_method: editMethod,
        reference_number: editReference,
        status: editStatus,
        notes: editNotes,
      };

      const updatedPayment = await updatePayment(payment.id, updateData);
      setPayment(updatedPayment);
      setShowEditModal(false);
      Alert.alert("Success", "Payment updated successfully");
    } catch (error) {
      console.error("Error updating payment:", error);
      Alert.alert("Error", "Failed to update payment");
    }
  };

  const handleViewReceipt = async () => {
    if (!payment) return;
    try {
      await displayPdfReceipt(payment.sale);
    } catch (error) {
      Alert.alert("Error", "Failed to display receipt");
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text>Loading payment details...</Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.centerContainer}>
        <Text>Payment not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowEditModal(true)}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.content}>
        {/* Payment Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>{formatCurrency(payment.amount)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Method:</Text>
            <Text style={styles.value}>{payment.payment_method}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status:</Text>
            <Text
              style={[styles.value, { color: getStatusColor(payment.status) }]}
            >
              {payment.status}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Reference:</Text>
            <Text style={styles.value}>
              {payment.reference_number || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {formatDateTime(payment.created_at)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Recorded by:</Text>
            <Text style={styles.value}>{payment.recorded_by_name}</Text>
          </View>
          {payment.notes && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Notes:</Text>
              <Text style={styles.value}>{payment.notes}</Text>
            </View>
          )}
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>
              {payment.sale_customer || "Unknown"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>
              {payment.sale_customer_phone || "N/A"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Salesperson:</Text>
            <Text style={styles.value}>{payment.salesperson_name}</Text>
          </View>
        </View>

        {/* Sale Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sale Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sale ID:</Text>
            <Text style={styles.value}>#{payment.sale}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Total Amount:</Text>
            <Text style={styles.value}>
              {formatCurrency(payment.sale_total_amount || 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Remaining Balance:</Text>
            <Text style={styles.value}>
              {formatCurrency(payment.sale_balance || 0)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={styles.value}>{payment.sale_payment_status}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Sale Date:</Text>
            <Text style={styles.value}>
              {payment.sale_created_at
                ? formatDateTime(payment.sale_created_at)
                : "N/A"}
            </Text>
          </View>
        </View>

        {/* Items Purchased */}
        {payment.sale_items_summary &&
          payment.sale_items_summary.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Items Purchased</Text>
              {payment.sale_items_summary.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product_name}</Text>
                    <Text style={styles.itemDetails}>
                      Qty: {item.quantity} × {formatCurrency(item.price)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.subtotal)}
                  </Text>
                </View>
              ))}
            </View>
          )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={handleViewReceipt}
          >
            <Ionicons name="receipt-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>View Receipt</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Payment</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editForm}>
              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Amount</Text>
                <TextInput
                  style={styles.formInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Payment Method</Text>
                <TextInput
                  style={styles.formInput}
                  value={editMethod}
                  onChangeText={setEditMethod}
                  placeholder="Cash, Credit, Mobile Money"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Reference Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={editReference}
                  onChangeText={setEditReference}
                  placeholder="Transaction reference"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Status</Text>
                <TextInput
                  style={styles.formInput}
                  value={editStatus}
                  onChangeText={setEditStatus}
                  placeholder="Completed, Pending, Failed"
                />
              </View>

              <View style={styles.formRow}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.notesInput]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  placeholder="Additional notes"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdatePayment}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerButton: {
    marginRight: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  itemDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  actionSection: {
    marginTop: 16,
    marginBottom: 32,
  },
  receiptButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
    maxHeight: "90%",
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
  editForm: {
    padding: 20,
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#333",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  notesInput: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
