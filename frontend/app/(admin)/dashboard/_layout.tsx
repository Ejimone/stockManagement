import { Stack } from "expo-router";

export default function AdminDashboardStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
