import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { createProduct } from "../../../services/api"; // Adjust path as needed
// For Picker: import { Picker } from '@react-native-picker/picker';

export default function AdminAddProductScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [category, setCategory] = useState(""); // TextInput for category as per plan

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // For field-specific or general errors

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    if (!productName.trim())
      newErrors.productName = "Product name is required.";
    if (!sku.trim()) newErrors.sku = "SKU is required.";
    if (!price.trim()) {
      newErrors.price = "Price is required.";
    } else if (isNaN(parseFloat(price))) {
      newErrors.price = "Price must be a valid number.";
    }
    if (!stockQuantity.trim()) {
      newErrors.stockQuantity = "Stock quantity is required.";
    } else if (!/^\d+$/.test(stockQuantity)) {
      // Ensure it's an integer
      newErrors.stockQuantity = "Stock quantity must be a valid integer.";
    }
    if (!category.trim()) newErrors.category = "Category is required.";
    // Add other validations as needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please check the form for errors.");
      return;
    }

    setIsLoading(true);
    setErrors({}); // Clear previous errors

    const productData = {
      name: productName.trim(),
      description: description.trim(),
      sku: sku.trim(),
      price: parseFloat(price), // Ensure conversion to number
      stock_quantity: parseInt(stockQuantity, 10), // Ensure conversion to integer
      category: category.trim(),
      // active: true, // Example: default value if your API expects it
    };

    try {
      await createProduct(productData);
      setIsLoading(false);
      Alert.alert("Success", "Product added successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
      // Optionally, clear form fields here if staying on page:
      // setProductName(''); setDescription(''); setSku(''); setPrice(''); setStockQuantity(''); setCategory('');
    } catch (err: any) {
      setIsLoading(false);
      console.error("Failed to create product:", err);
      if (
        err.response &&
        err.response.data &&
        typeof err.response.data === "object"
      ) {
        // Assuming backend returns errors in a format like { field_name: ["error message"] }
        const backendErrors: Record<string, string | undefined> = {};
        for (const key in err.response.data) {
          if (
            Array.isArray(err.response.data[key]) &&
            err.response.data[key].length > 0
          ) {
            backendErrors[key] = err.response.data[key][0];
          } else {
            backendErrors.general = backendErrors.general
              ? `${backendErrors.general}, ${err.response.data[key]}`
              : `${err.response.data[key]}`;
          }
        }
        setErrors(backendErrors);
        Alert.alert(
          "Error Adding Product",
          "Please review the errors below or try again."
        );
      } else {
        setErrors({ general: err.message || "An unexpected error occurred." });
        Alert.alert(
          "Error",
          err.message || "An unexpected error occurred. Please try again."
        );
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.mainContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.formContainer}>
          <Text style={styles.pageTitle}>Add New Product</Text>

          {errors.general && errors.general.trim() && (
            <Text key="general-error" style={styles.errorTextGeneral}>
              {errors.general}
            </Text>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Product Name <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                errors.productName ? styles.inputError : null,
              ]}
              placeholder="e.g., Wireless Mouse"
              value={productName}
              onChangeText={setProductName}
              editable={!isLoading}
            />
            {errors.productName && errors.productName.trim() && (
              <Text key="productName-error" style={styles.errorText}>
                {errors.productName}
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.description ? styles.inputError : null,
              ]}
              placeholder="e.g., High precision optical mouse with ergonomic design."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
            {errors.description && errors.description.trim() && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              SKU <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.sku ? styles.inputError : null]}
              placeholder="e.g., WM-1023-BLK"
              value={sku}
              onChangeText={setSku}
              autoCapitalize="characters"
              editable={!isLoading}
            />
            {errors.sku && errors.sku.trim() && (
              <Text style={styles.errorText}>{errors.sku}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Price <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.price ? styles.inputError : null]}
                placeholder="e.g., 29.99"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {errors.price && errors.price.trim() && (
                <Text key="price-error" style={styles.errorText}>
                  {errors.price}
                </Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Stock Quantity <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  errors.stockQuantity ? styles.inputError : null,
                ]}
                placeholder="e.g., 150"
                value={stockQuantity}
                onChangeText={setStockQuantity}
                keyboardType="numeric"
                editable={!isLoading}
              />
              {errors.stockQuantity && errors.stockQuantity.trim() && (
                <Text style={styles.errorText}>{errors.stockQuantity}</Text>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
            {/* Using TextInput for category as discussed. Replace with Picker for better UX if categories are predefined. */}
            <TextInput
              style={[styles.input, errors.category ? styles.inputError : null]}
              placeholder="e.g., Electronics, Office Supplies"
              value={category}
              onChangeText={setCategory}
              editable={!isLoading}
            />
            {/* 
        Example for Picker:
        <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)} style={styles.input}>
          <Picker.Item label="Select Category..." value="" />
          <Picker.Item label="Electronics" value="electronics" />
          <Picker.Item label="Books" value="books" />
        </Picker> 
        */}
            {errors.category && errors.category.trim() && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                isLoading && styles.disabledButton,
              ]}
              onPress={handleSaveProduct}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  Save Product
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20, // Reduced since buttons are now inside
  },
  formContainer: {
    flex: 1,
    marginTop: 60,
    marginHorizontal: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34495E",
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: "#E74C3C",
  },
  input: {
    backgroundColor: "#F8F9FA",
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    color: "#2C3E50",
  },
  inputError: {
    borderColor: "#E74C3C",
    borderWidth: 1,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
    paddingTop: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  halfWidth: {
    flex: 0.48,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    marginBottom: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButton: {
    backgroundColor: "#3498DB",
  },
  cancelButton: {
    backgroundColor: "#95A5A6",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButtonText: {
    color: "#FFFFFF",
  },
  cancelButtonText: {
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
  errorText: {
    color: "#E74C3C",
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  errorTextGeneral: {
    color: "#E74C3C",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
    backgroundColor: "#FADBD8",
    padding: 10,
    borderRadius: 8,
  },
});
