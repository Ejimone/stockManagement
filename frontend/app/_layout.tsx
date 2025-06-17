import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext"; // Adjusted path
import { ToastProvider } from "../components/ui/Toast"; // Add toast provider
import React, { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // Gives an array of the current route segments

  useEffect(() => {
    if (isLoading) {
      // Still loading auth state, do nothing regarding navigation yet.
      // Splash screen is visible.
      return;
    }

    SplashScreen.hideAsync(); // Hide splash screen once auth state is determined and not loading.

    const inAuthGroup = segments[0] === "(auth)";

    if (isAuthenticated) {
      // User is authenticated
      const targetGroup = user?.role === "Admin" ? "(admin)" : "(sales)";
      const targetDashboard = `/${targetGroup}/dashboard`;

      // Check if already in the correct group to prevent loop
      // Only redirect if not in the right group (admin vs sales)
      if (segments[0] !== targetGroup) {
        router.replace(targetDashboard as any);
      }
    } else {
      // User is not authenticated
      if (!inAuthGroup) {
        router.replace("/(auth)/login");
      }
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  if (isLoading) {
    // This will be shown after splash screen hides if still loading,
    // or if AuthProvider finishes loading before this component mounts.
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Render the appropriate navigator based on authentication state
  // The router.replace in useEffect will handle directing to the correct initial screen.
  // Slot will render the child route (either (auth), (admin), or (sales) stack)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(sales)" />
      {/* +not-found is automatically handled by Expo Router if a screen exists */}
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <InitialLayout />
      </ToastProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
