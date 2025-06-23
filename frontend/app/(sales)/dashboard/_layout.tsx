import { Stack } from "expo-router";

export default function SalesDashboardStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Dashboard" }} />
      {/* Add other screens specific to dashboard stack if any */}
    </Stack>
  );
}
