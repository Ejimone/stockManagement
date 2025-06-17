import { Stack } from "expo-router";

export default function AdminUsersStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Employees" }} />
      <Stack.Screen name="add" options={{ title: "Add Employee" }} />
      <Stack.Screen name="[id]" options={{ title: "User Details" }} />
    </Stack>
  );
}
