import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function AdminUsersScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Users List Screen</Text>
      <Link href="/(admin)/users/add" style={{ marginVertical: 10 }}>Add New User</Link>
      <Link href="/(admin)/users/xyz">View User xyz</Link>
      {/* Title set in _layout.tsx */}
    </View>
  );
}
