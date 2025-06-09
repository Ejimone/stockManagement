import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
export default function SalesCreateSaleScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'Create Sale' }} />
      <Text>Sales - Create Sale Screen</Text>
    </View>
  );
}
