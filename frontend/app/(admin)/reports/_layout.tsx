import { Stack } from 'expo-router';

export default function AdminReportsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Reports Dashboard' }} />
      {/* Add other screens for specific reports if any, e.g., "sales-summary.tsx" */}
    </Stack>
  );
}
