import { Stack } from 'expo-router';

export default function AdminDashboardStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      {/* Add other screens specific to dashboard stack if any */}
    </Stack>
  );
}
