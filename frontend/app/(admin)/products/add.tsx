import { Text, View } from 'react-native';
import { Stack } from 'expo-router';

export default function AdminAddProductScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Title set in _layout.tsx */}
      <Text>Admin Add Product Screen</Text>
      {/* Add form components here */}
    </View>
  );
}
