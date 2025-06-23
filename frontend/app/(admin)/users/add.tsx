import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { createUser } from "../../../services/api";
import { useToast } from "../../../components/ui/Toast";
import { LoadingSpinner } from "../../../components/ui/LoadingComponents";

export default function AdminAddUserScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};

    // Email validation
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    // Name validations
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";

    // Password validation
    if (!password.trim()) {
      errs.password = "Password is required.";
    } else if (password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }

    return errs;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      Alert.alert("Validation Error", "Please fill in required fields.");
      return;
    }
    setIsLoading(true);
    try {
      const userData = {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: password,
        role: "Salesperson",
        is_active: isActive,
      };

      console.log("Sending user data:", userData);
      await createUser(userData);
      showToast("User added successfully!", "success");
      // Short delay to show the success message before navigating back
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      console.error("Failed to add user:", err);

      // Better error handling for different types of errors
      let errorMessage = "Failed to add user.";

      if (err.response?.data) {
        // Handle field-specific validation errors
        if (typeof err.response.data === "object") {
          const fieldErrors = err.response.data;
          let errorDetails = [];

          // Extract field-specific errors
          if (fieldErrors.email) {
            errorDetails.push(`Email: ${fieldErrors.email[0]}`);
          }
          if (fieldErrors.first_name) {
            errorDetails.push(`First Name: ${fieldErrors.first_name[0]}`);
          }
          if (fieldErrors.last_name) {
            errorDetails.push(`Last Name: ${fieldErrors.last_name[0]}`);
          }
          if (fieldErrors.password) {
            errorDetails.push(`Password: ${fieldErrors.password[0]}`);
          }
          if (fieldErrors.non_field_errors) {
            errorDetails.push(fieldErrors.non_field_errors[0]);
          }

          if (errorDetails.length > 0) {
            errorMessage = errorDetails.join("\n");
          }
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      showToast(errorMessage, "error", 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading overlay when creating user */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner text="Creating user..." />
          </View>
        )}

        <View style={styles.formContainer}>
          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: "" });
                }
              }}
              editable={!isLoading}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="John"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) {
                  setErrors({ ...errors, firstName: "" });
                }
              }}
              editable={!isLoading}
            />
            {errors.firstName && (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Doe"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) {
                  setErrors({ ...errors, lastName: "" });
                }
              }}
              editable={!isLoading}
            />
            {errors.lastName && (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={[styles.input, errors.password && styles.inputError]}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: "" });
                }
              }}
              editable={!isLoading}
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          <View style={styles.fieldInline}>
            <Text style={styles.label}>Active</Text>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              disabled={isLoading}
            />
          </View>

          {/* Buttons moved inside ScrollView */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancel]}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.save,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>Save User</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} // end of AdminAddUserScreen

// Styles for AdminAddUserScreen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60, // Margin from top for better spacing
  },
  formContainer: {
    padding: 16,
    backgroundColor: "#fff",
    margin: 16,
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
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 999,
    justifyContent: "center",
    alignItems: "center",
  },
  field: {
    marginBottom: 16,
  },
  fieldInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f8f8",
  },
  inputError: {
    borderColor: "#f00",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  cancel: {
    backgroundColor: "#6c757d",
  },
  save: {
    backgroundColor: "#007AFF",
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
});
