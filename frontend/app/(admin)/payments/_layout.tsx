import { Stack } from "expo-router";

export default function AdminPaymentsStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      {/* Add other screens like payment details if needed, e.g., "[id].tsx" */}
    </Stack>
  );
}
