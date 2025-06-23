import { Stack } from "expo-router";

export default function SalesDashboardStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Add other screens specific to dashboard stack if any */}
    </Stack>
  );
}
