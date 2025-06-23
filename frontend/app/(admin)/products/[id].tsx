import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  getProductDetails,
  updateProduct,
  Product,
} from "../../../services/api";
import { formatCurrency } from "../../../utils/formatters";

export default function AdminProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    stock_quantity: "",
  });

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const productData = await getProductDetails(id as string);
      setProduct(productData);

      // Initialize form with product data
      setFormData({
        name: productData.name || "",
        sku: productData.sku || "",
        description: productData.description || "",
        category: productData.category || "",
        price: productData.price?.toString() || "",
        stock_quantity: productData.stock_quantity?.toString() || "",
      });
    } catch (err: any) {
      console.error("Failed to fetch product details:", err);
      setError(err.message || "Failed to load product details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Product name is required");
      return false;
    }

    if (formData.price && isNaN(parseFloat(formData.price))) {
      Alert.alert("Validation Error", "Price must be a valid number");
      return false;
    }

    if (formData.stock_quantity && isNaN(parseInt(formData.stock_quantity))) {
      Alert.alert("Validation Error", "Stock quantity must be a valid number");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      const updateData: any = {
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
      };

      if (formData.price) {
        updateData.price = parseFloat(formData.price);
      }

      if (formData.stock_quantity) {
        updateData.stock_quantity = parseInt(formData.stock_quantity);
      }

      const updatedProduct = await updateProduct(id as string, updateData);
      setProduct(updatedProduct);

      Alert.alert("Success", "Product updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      console.error("Failed to update product:", err);
      setError(err.message || "Failed to update product");
      Alert.alert("Error", err.message || "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Changes",
      "Are you sure you want to cancel? Any unsaved changes will be lost.",
      [
        {
          text: "Continue Editing",
          style: "cancel",
        },
        {
          text: "Cancel Changes",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (error && !product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchProductDetails}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isSaving}>
              <Text
                style={[
                  styles.headerButton,
                  isSaving && styles.headerButtonDisabled,
                ]}
              >
                {isSaving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Product Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange("name", value)}
              placeholder="Enter product name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>SKU</Text>
            <TextInput
              style={styles.input}
              value={formData.sku}
              onChangeText={(value) => handleInputChange("sku", value)}
              placeholder="Enter SKU"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange("description", value)}
              placeholder="Enter product description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(value) => handleInputChange("category", value)}
              placeholder="Enter category"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(value) => handleInputChange("price", value)}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
            {formData.price && !isNaN(parseFloat(formData.price)) && (
              <Text style={styles.previewText}>
                Preview: {formatCurrency(parseFloat(formData.price))}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={formData.stock_quantity}
              onChangeText={(value) =>
                handleInputChange("stock_quantity", value)
              }
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={handleCancel}
          disabled={isSaving}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6C757D",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  backButton: {
    backgroundColor: "#6C757D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed buttons
  },
  formContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343A40",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#343A40",
    marginBottom: 8,
  },
  required: {
    color: "#DC3545",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#343A40",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  previewText: {
    marginTop: 5,
    fontSize: 14,
    color: "#28A745",
    fontWeight: "500",
  },
  errorBanner: {
    backgroundColor: "#F8D7DA",
    borderColor: "#F5C6CB",
    borderWidth: 1,
    borderRadius: 5,
    padding: 15,
    marginTop: 10,
  },
  errorBannerText: {
    color: "#721C24",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#6C757D",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#007AFF",
    marginLeft: 10,
  },
  saveButtonDisabled: {
    backgroundColor: "#A0A0A0",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerButton: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerButtonDisabled: {
    color: "#A0A0A0",
  },
});
