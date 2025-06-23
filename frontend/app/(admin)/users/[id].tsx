import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { getUserDetails, updateUser, deleteUser } from "../../../services/api";
import { User } from "../../../contexts/AuthContext";

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserDetails(id as string);
      setUser(userData);
      setEmail(userData.email || "");
      setFirstName(userData.first_name || "");
      setLastName(userData.last_name || "");
      setIsActive(userData.is_active ?? true);
    } catch (err: any) {
      console.error("Failed to fetch user details:", err);
      Alert.alert("Error", "Failed to load user details.");
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) errs.email = "Email is required.";
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    return errs;
  };

  const handleSave = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      Alert.alert("Validation Error", "Please fill in required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        email: email.trim(),
        username: email.trim(), // Set username to email since that's how the model works
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_active: isActive,
      };

      // Only include password if it's provided
      if (password.trim()) {
        updateData.password = password;
      }

      console.log("Sending update data:", updateData);
      await updateUser(id as string, updateData);
      Alert.alert("Success", "User updated successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Failed to update user:", err);
      console.error("Error response:", err.response?.data);

      let errorMessage = "Failed to update user.";
      if (err.response?.data) {
        // Handle field-specific errors
        if (typeof err.response.data === "object") {
          const fieldErrors = [];
          for (const [field, messages] of Object.entries(err.response.data)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(", ")}`);
            } else {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join("\n");
          }
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    const userName =
      user?.first_name && user?.last_name
        ? `${user.first_name} ${user.last_name}`
        : user?.email || "this user";

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteUser(id as string);
              Alert.alert("Success", "User deleted successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (err: any) {
              console.error("Failed to delete user:", err);
              Alert.alert(
                "Error",
                err.response?.data?.detail ||
                  err.message ||
                  "Failed to delete user."
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>User not found.</Text>
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
      <View style={styles.field}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!isSaving && !isDeleting}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>First Name *</Text>
        <TextInput
          style={[styles.input, errors.firstName && styles.inputError]}
          placeholder="John"
          value={firstName}
          onChangeText={setFirstName}
          editable={!isSaving && !isDeleting}
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
          onChangeText={setLastName}
          editable={!isSaving && !isDeleting}
        />
        {errors.lastName && (
          <Text style={styles.errorText}>{errors.lastName}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>
          New Password (leave blank to keep current)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!isSaving && !isDeleting}
        />
      </View>

      <View style={styles.fieldInline}>
        <Text style={styles.label}>Active</Text>
        <Switch
          value={isActive}
          onValueChange={setIsActive}
          disabled={isSaving || isDeleting}
        />
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.infoLabel}>Role:</Text>
        <Text style={styles.infoValue}>{user.role}</Text>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.infoLabel}>Date Joined:</Text>
        <Text style={styles.infoValue}>
          {user.date_joined
            ? new Date(user.date_joined).toLocaleDateString()
            : "N/A"}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          onPress={() => router.back()}
          disabled={isSaving || isDeleting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.delete,
            (isSaving || isDeleting) && styles.disabled,
          ]}
          onPress={handleDelete}
          disabled={isSaving || isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.deleteText}>Delete</Text>
          )}
        </TouchableOpacity>

        {isSaving ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.save, isDeleting && styles.disabled]}
            onPress={handleSave}
            disabled={isSaving || isDeleting}
          >
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    paddingTop: 50, // Added top margin for header-less pages
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
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
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#ff0000",
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#6c757d",
  },
  delete: {
    backgroundColor: "#dc3545",
  },
  save: {
    backgroundColor: "#007AFF",
  },
  disabled: {
    opacity: 0.6,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loader: {
    alignSelf: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 4,
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
