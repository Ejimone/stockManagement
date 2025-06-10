import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import {
  createSale,
  getProducts,
  displayPdfReceipt,
  Product,
} from "../../../services/api";
import { useAuth } from "../../../contexts/AuthContext";
import { formatPrice } from "../../../utils/formatters";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function SalesCreateSaleScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle preselected product from navigation params
  useEffect(() => {
    if (
      params.preselectedProductId &&
      products.length > 0 &&
      cart.length === 0
    ) {
      const preselectedProduct = products.find(
        (product) => product.id.toString() === params.preselectedProductId
      );

      if (preselectedProduct) {
        addToCart(preselectedProduct);
        // Note: We don't show an alert here since the banner provides visual feedback
      }
    }
  }, [products, params.preselectedProductId]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await getProducts({ active_only: true });
      setProducts(response.results || response);
    } catch (err: any) {
      console.error("Failed to fetch products:", err);
      Alert.alert("Error", "Failed to load products.");
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  const updateCartItemQuantity = (
    productId: string | number,
    quantity: number
  ) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.product.id !== productId));
    } else {
      setCart(
        cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price =
        typeof item.product.price === "string"
          ? parseFloat(item.product.price)
          : item.product.price || 0;
      return total + price * item.quantity;
    }, 0);
  };

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      Alert.alert("Error", "Please add at least one product to the cart.");
      return;
    }

    const total = calculateTotal();
    const paidAmount = parseFloat(amountPaid) || 0;

    if (paidAmount < 0) {
      Alert.alert("Error", "Amount paid cannot be negative.");
      return;
    }

    setIsSaving(true);
    try {
      const saleData = {
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        payment_method: paymentMethod,
        amount_paid: paidAmount,
        notes: notes.trim() || null,
        products_sold_data: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const newSale = await createSale(saleData);

      // Show success with PDF receipt options
      Alert.alert(
        "Sale Created Successfully!",
        "Would you like to download the receipt?",
        [
          {
            text: "Later",
            style: "cancel",
            onPress: () => router.back(),
          },
          {
            text: "Download Receipt",
            onPress: async () => {
              try {
                await displayPdfReceipt(newSale.id);
                router.back();
              } catch (error) {
                console.error("Failed to download receipt:", error);
                Alert.alert(
                  "Error",
                  "Failed to download receipt, but sale was created successfully"
                );
                router.back();
              }
            },
          },
        ]
      );
    } catch (err: any) {
      console.error("Failed to create sale:", err);
      let errorMessage = "Failed to create sale.";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === "object") {
          const errors = Object.entries(err.response.data)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n");
          errorMessage = errors;
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      searchQuery === "" ||
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => addToCart(item)}
      disabled={!item.stock_quantity || item.stock_quantity <= 0}
    >
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productSku}>SKU: {item.sku}</Text>
        <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
        <Text
          style={[
            styles.productStock,
            !item.stock_quantity || item.stock_quantity <= 0
              ? styles.outOfStock
              : null,
          ]}
        >
          Stock: {item.stock_quantity || 0}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.addButton,
          (!item.stock_quantity || item.stock_quantity <= 0) &&
            styles.disabledButton,
        ]}
        onPress={() => addToCart(item)}
        disabled={!item.stock_quantity || item.stock_quantity <= 0}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const price =
      typeof item.product.price === "string"
        ? parseFloat(item.product.price)
        : item.product.price || 0;
    const subtotal = price * item.quantity;

    return (
      <View style={styles.cartItem}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.product.name}</Text>
          <Text style={styles.cartItemPrice}>
            {item.quantity} × {formatPrice(price)} = {formatPrice(subtotal)}
          </Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              updateCartItemQuantity(item.product.id, item.quantity - 1)
            }
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              updateCartItemQuantity(item.product.id, item.quantity + 1)
            }
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  const total = calculateTotal();
  const paidAmount = parseFloat(amountPaid) || 0;
  const balance = total - paidAmount;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          title: params.preselectedProductName
            ? `Create Sale - ${params.preselectedProductName}`
            : "Create New Sale",
        }}
      />

      {/* Preselected Product Banner */}
      {params.preselectedProductId && params.preselectedProductName && (
        <View style={styles.preselectedBanner}>
          <Text style={styles.preselectedText}>
            🛒 Starting sale with: {params.preselectedProductName}
          </Text>
          <Text style={styles.preselectedSubtext}>
            You can add more products or adjust the quantity below.
          </Text>
        </View>
      )}

      {/* Product Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Add Products</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          style={styles.productList}
        />
      </View>

      {/* Cart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cart ({cart.length} items)</Text>
        {cart.length > 0 ? (
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.product.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={styles.emptyCartText}>No items in cart</Text>
        )}

        {cart.length > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total: {formatPrice(total)}</Text>
          </View>
        )}
      </View>

      {/* Customer Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Customer Information (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Customer Name"
          value={customerName}
          onChangeText={setCustomerName}
        />
        <TextInput
          style={styles.input}
          placeholder="Customer Phone"
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Payment Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Information</Text>

        {/* Payment Method Selection */}
        <Text style={styles.label}>Payment Method</Text>
        <View style={styles.paymentMethods}>
          {["Cash", "Credit", "Mobile Money", "Bank Transfer"].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentMethodButton,
                paymentMethod === method && styles.selectedPaymentMethod,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text
                style={[
                  styles.paymentMethodText,
                  paymentMethod === method && styles.selectedPaymentMethodText,
                ]}
              >
                {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Amount Paid"
          value={amountPaid}
          onChangeText={setAmountPaid}
          keyboardType="numeric"
        />

        {total > 0 && (
          <View style={styles.paymentSummary}>
            <Text style={styles.summaryText}>Total: {formatPrice(total)}</Text>
            <Text style={styles.summaryText}>
              Paid: {formatPrice(paidAmount)}
            </Text>
            <Text
              style={[
                styles.summaryText,
                balance > 0 ? styles.balanceOwed : styles.balancePaid,
              ]}
            >
              Balance: {formatPrice(balance)}
            </Text>
          </View>
        )}
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Additional notes..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {isSaving ? (
          <ActivityIndicator
            style={styles.saveLoader}
            size="small"
            color="#007AFF"
          />
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              cart.length === 0 && styles.disabledButton,
            ]}
            onPress={handleCreateSale}
            disabled={cart.length === 0}
          >
            <Text style={styles.saveButtonText}>Create Sale</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  productList: {
    maxHeight: 200,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 4,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
  },
  productSku: {
    fontSize: 14,
    color: "#666",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007AFF",
  },
  productStock: {
    fontSize: 14,
    marginTop: 4,
  },
  outOfStock: {
    color: "red",
    fontWeight: "bold",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 24,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 4,
    marginBottom: 8,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: "500",
  },
  cartItemPrice: {
    fontSize: 14,
    color: "#666",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  quantityButtonText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 18,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    marginHorizontal: 8,
  },
  totalContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginTop: 8,
  },
  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
  },
  paymentMethods: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  paymentMethodButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPaymentMethod: {
    backgroundColor: "#007AFF",
  },
  paymentMethodText: {
    fontSize: 16,
    color: "#007AFF",
  },
  selectedPaymentMethodText: {
    color: "#fff",
  },
  paymentSummary: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginTop: 8,
  },
  summaryText: {
    fontSize: 16,
    marginBottom: 4,
  },
  balanceOwed: {
    color: "red",
    fontWeight: "bold",
  },
  balancePaid: {
    color: "green",
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f44336",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  saveLoader: {
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
  },
  emptyCartText: {
    textAlign: "center",
    fontSize: 16,
    color: "#999",
    paddingVertical: 16,
  },
  preselectedBanner: {
    backgroundColor: "#e7f3ff",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  preselectedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  preselectedSubtext: {
    fontSize: 14,
    color: "#3730a3",
  },
});
