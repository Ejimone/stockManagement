import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function AdminSalesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Sales List Screen</Text>
      <Link href="/(admin)/sales/create" style={{ marginVertical: 10 }}>Create New Sale</Link>
      <Link href="/(admin)/sales/abc">View Sale abc</Link>
      {/* Title set in _layout.tsx */}
    </View>
  );
}
