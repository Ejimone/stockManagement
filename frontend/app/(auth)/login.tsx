import { Text, View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router'; // useRouter might not be needed if redirection is fully handled by _layout
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth(); // Use signIn from AuthContext
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Local error for immediate feedback
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      Alert.alert('Validation Error', 'Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoggingIn(true);

    try {
      const success = await signIn(email, password); // Call AuthContext's signIn

      if (!success) {
        // signIn in AuthContext should ideally throw or return specific error info
        // For now, we assume it returns false on failure and might have logged details.
        setError('Login failed. Please check your credentials or network.');
        Alert.alert('Login Failed', 'Invalid email or password, or server error.');
      }
      // If successful, AuthContext state changes and RootLayout's useEffect handles redirection.
      // No explicit router.replace() needed here.
    } catch (err: any) {
      // This catch block might be redundant if signIn itself handles all errors
      // and doesn't re-throw, or if it re-throws a generic error.
      console.error('Login screen caught error:', err);
      setError(err.message || 'An unexpected error occurred during login.');
      Alert.alert('Login Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Login', headerShown: false }} />
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

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoggingIn}>
        {isLoggingIn ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Feature not implemented yet.")}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 30,
    color: '#333333',
  },
  input: {
    backgroundColor: '#f0f2f5',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#0c7ff2',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#60758a',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginVertical: 15,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
});
