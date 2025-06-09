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
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { createUser } from "../../../services/api";

export default function AdminAddUserScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!email.trim()) errs.email = "Email is required.";
    if (!password.trim()) errs.password = "Password is required.";
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
      await createUser({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: password,
        role: "Salesperson",
        is_active: isActive,
      });
      Alert.alert("Success", "User added successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err: any) {
      console.error("Failed to add user:", err);
      Alert.alert(
        "Error",
        err.response?.data?.detail || err.message || "Failed to add user."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Add Salesperson" }} />
      <View style={styles.field}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Doe"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <View style={styles.fieldInline}>
        <Text style={styles.label}>Active</Text>
        <Switch value={isActive} onValueChange={setIsActive} />
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancel]}
          onPress={() => router.back()}
          disabled={isLoading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.save]}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  field: { marginBottom: 12 },
  fieldInline: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  label: { fontSize: 16, marginBottom: 4, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
  },
  inputError: { borderColor: "#f00" },
  actions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 24 },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  cancel: { backgroundColor: "#ddd", marginRight: 10 },
  save: { backgroundColor: "#007AFF" },
  cancelText: { color: "#333", fontSize: 16 },
  saveText: { color: "#fff", fontSize: 16 },
  loader: { alignSelf: "center" },
});
