import { Stack } from 'expo-router';

export default function AdminSalesStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Sales List' }} />
      <Stack.Screen name="create" options={{ title: 'Create New Sale' }} />
      <Stack.Screen name="[id]" options={{ title: 'Sale Details' }} />
    </Stack>
  );
}
