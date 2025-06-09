import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { createProduct } from '../../../services/api'; // Adjust path as needed
// For Picker: import { Picker } from '@react-native-picker/picker';

export default function AdminAddProductScreen() {
  const router = useRouter();

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [category, setCategory] = useState(''); // TextInput for category as per plan

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // For field-specific or general errors

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    if (!productName.trim()) newErrors.productName = 'Product name is required.';
    if (!sku.trim()) newErrors.sku = 'SKU is required.';
    if (!price.trim()) {
        newErrors.price = 'Price is required.';
    } else if (isNaN(parseFloat(price))) {
        newErrors.price = 'Price must be a valid number.';
    }
    if (!stockQuantity.trim()) {
        newErrors.stockQuantity = 'Stock quantity is required.';
    } else if (!/^\d+$/.test(stockQuantity)) { // Ensure it's an integer
        newErrors.stockQuantity = 'Stock quantity must be a valid integer.';
    }
    if (!category.trim()) newErrors.category = 'Category is required.';
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
        { text: "OK", onPress: () => router.back() }
      ]);
      // Optionally, clear form fields here if staying on page:
      // setProductName(''); setDescription(''); setSku(''); setPrice(''); setStockQuantity(''); setCategory('');
    } catch (err: any) {
      setIsLoading(false);
      console.error("Failed to create product:", err);
      if (err.response && err.response.data && typeof err.response.data === 'object') {
        // Assuming backend returns errors in a format like { field_name: ["error message"] }
        const backendErrors: Record<string, string | undefined> = {};
        for (const key in err.response.data) {
          if (Array.isArray(err.response.data[key]) && err.response.data[key].length > 0) {
            backendErrors[key] = err.response.data[key][0];
          } else {
            backendErrors.general = backendErrors.general ? `${backendErrors.general}, ${err.response.data[key]}` : `${err.response.data[key]}`;
          }
        }
        setErrors(backendErrors);
        Alert.alert("Error Adding Product", "Please review the errors below or try again.");
      } else {
        setErrors({ general: err.message || "An unexpected error occurred." });
        Alert.alert("Error", err.message || "An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Title is set by _layout.tsx, but can be overridden here if needed */}
      {/* <Stack.Screen options={{ title: 'Add New Product' }} /> */}

      {errors.general && <Text style={styles.errorTextGeneral}>{errors.general}</Text>}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Product Name <Text style={styles.requiredAsterisk}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.productName ? styles.inputError : null]}
          placeholder="e.g., Wireless Mouse"
          value={productName}
          onChangeText={setProductName}
          editable={!isLoading}
        />
        {errors.productName && <Text style={styles.errorText}>{errors.productName}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
          placeholder="e.g., High precision optical mouse with ergonomic design."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          editable={!isLoading}
        />
        {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>SKU <Text style={styles.requiredAsterisk}>*</Text></Text>
        <TextInput
          style={[styles.input, errors.sku ? styles.inputError : null]}
          placeholder="e.g., WM-1023-BLK"
          value={sku}
          onChangeText={setSku}
          autoCapitalize="characters"
          editable={!isLoading}
        />
        {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Price <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.price ? styles.inputError : null]}
            placeholder="e.g., 29.99"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            editable={!isLoading}
          />
          {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Stock Quantity <Text style={styles.requiredAsterisk}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.stockQuantity ? styles.inputError : null]}
            placeholder="e.g., 150"
            value={stockQuantity}
            onChangeText={setStockQuantity}
            keyboardType="numeric"
            editable={!isLoading}
          />
          {errors.stockQuantity && <Text style={styles.errorText}>{errors.stockQuantity}</Text>}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Category <Text style={styles.requiredAsterisk}>*</Text></Text>
        {/* Using TextInput for category as discussed. Replace with Picker for better UX if categories are predefined. */}
        <TextInput
          style={[styles.input, errors.category ? styles.inputError : null]}
          placeholder="e.g., Electronics, Office Supplies"
          value={category}
          onChangeText={setCategory}
          editable={!isLoading}
        />
        {/* Example for Picker:
        <Picker selectedValue={category} onValueChange={(itemValue) => setCategory(itemValue)} style={styles.input}>
          <Picker.Item label="Select Category..." value="" />
          <Picker.Item label="Electronics" value="electronics" />
          <Picker.Item label="Books" value="books" />
        </Picker> */}
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Cancel" onPress={() => router.back()} color="#6C757D" disabled={isLoading} />
        <View style={{ width: 10 }} /> {/* Spacer */}
        {isLoading ? (
          <ActivityIndicator size="small" color="#007BFF" />
        ) : (
          <Button title="Save Product" onPress={handleSaveProduct} color="#007BFF" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#495057', // Darker gray for labels
    marginBottom: 6,
  },
  requiredAsterisk: {
    color: 'red',
  },
  input: {
    backgroundColor: '#F8F9FA', // Lighter input background
    height: 50, // Standard height
    borderRadius: 8, // More rounded corners
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#CED4DA', // Standard border color
  },
  inputError: {
    borderColor: '#DC3545', // Red border for errors
  },
  textArea: {
    height: 100, // Taller for multiline input
    textAlignVertical: 'top', // Align text to top for multiline
    paddingTop: 12, // Adjust padding for multiline
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 0.48, // Take slightly less than half to allow for spacing
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 25,
    marginBottom: 20, // Extra margin at bottom
    paddingBottom: Platform.OS === 'ios' ? 20 : 0, // Padding for iOS home indicator
  },
  errorText: {
    color: '#DC3545',
    fontSize: 13, // Slightly smaller error text
    marginTop: 4,
  },
  errorTextGeneral: {
    color: '#DC3545',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: '500',
  },
  // Styles for Button component are limited, use TouchableOpacity for custom buttons
});
