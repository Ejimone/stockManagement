import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router"; // useRouter might not be needed if redirection is fully handled by _layout
import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth(); // Use signIn from AuthContext
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Local error for immediate feedback
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Retry login attempt with delay
  const retryLogin = async (
    email: string,
    password: string,
    retries = 2,
    delay = 1000
  ): Promise<boolean> => {
    try {
      const success = await signIn(email, password);
      return success;
    } catch (error) {
      if (retries <= 0) throw error;

      console.log(
        `Login attempt failed. Retrying in ${delay}ms... (${retries} attempts left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryLogin(email, password, retries - 1, delay * 1.5);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      Alert.alert("Validation Error", "Please enter both email and password.");
      return;
    }
    setError("");
    setIsLoggingIn(true);

    try {
      console.log("Login attempt for:", email);
      // For testing/debugging (remove in production)
      if (email === "test@example.com" && password === "password") {
        Alert.alert(
          "Debug Info",
          "Using test credentials. This is only for debugging."
        );
      }

      const success = await retryLogin(email, password); // Call AuthContext's signIn

      if (!success) {
        console.error("Login failed through AuthContext signIn");
        // More detailed error for troubleshooting network issues
        setError(
          "Login failed. Please check:\n- Your credentials\n- Network connection\n- Server status"
        );
        Alert.alert(
          "Login Failed",
          "Could not authenticate. This could be due to:\n\n" +
            "- Incorrect email/password\n" +
            "- Network connection issues\n" +
            "- Backend server unavailable\n\n" +
            "Check the console logs for technical details."
        );
      }
      // If successful, AuthContext state changes and RootLayout's useEffect handles redirection.
    } catch (err: any) {
      console.error("Login screen caught error:", err);

      // Provide more helpful error messages based on error type
      let errorMessage = "An unexpected error occurred during login.";

      if (err.message && err.message.includes("Network Error")) {
        errorMessage =
          "Network connection error. Please check that:\n\n" +
          "- Your device has internet access\n" +
          "- The backend server is running\n" +
          "- The API URL is correctly configured";
      } else if (err.response && err.response.status === 401) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (err.response) {
        errorMessage = `Server error (${err.response.status}): ${JSON.stringify(
          err.response.data
        )}`;
      }

      setError(errorMessage);
      Alert.alert("Login Error", errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Login", headerShown: false }} />
      <Text style={styles.title}>Jonkech</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isLoggingIn}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoggingIn}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          Alert.alert("Forgot Password", "Feature not implemented yet.")
        }
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 30,
    color: "#333333",
  },
  input: {
    backgroundColor: "#f0f2f5",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  button: {
    backgroundColor: "#0c7ff2",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordText: {
    color: "#60758a",
    textAlign: "center",
    textDecorationLine: "underline",
    marginVertical: 15,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
});
