import { Stack } from "expo-router";

export default function AdminReportsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Add other screens for specific reports if any, e.g., "sales-summary.tsx" */}
    </Stack>
  );
}
