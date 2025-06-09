import { Stack } from 'expo-router';

export default function AdminUsersStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'User List' }} />
      <Stack.Screen name="add" options={{ title: 'Add New User' }} />
      <Stack.Screen name="[id]" options={{ title: 'User Details' }} />
    </Stack>
  );
}
