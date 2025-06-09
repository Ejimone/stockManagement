import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
export default function SalesMySalesScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'My Sales' }} />
      <Text>Sales - My Sales Screen</Text>
    </View>
  );
}
