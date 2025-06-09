import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
export default function SalesProductListScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'View Products' }} />
      <Text>Sales - Product List Screen</Text>
    </View>
  );
}
