import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      {/* <Stack.Screen name="signup" /> */}
      {/* Add other auth screens here like forgot-password */}
    </Stack>
  );
}
