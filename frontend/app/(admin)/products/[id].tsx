import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function AdminProductDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {/* Title set in _layout.tsx, or can be dynamic here */}
      {/* <Stack.Screen options={{ title: `Product ${id}` }} /> */}
      <Text>Admin Product Detail Screen</Text>
      <Text>Product ID: {id}</Text>
      {/* Add form for editing or display details here */}
    </View>
  );
}
