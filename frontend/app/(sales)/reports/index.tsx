import { Text, View } from 'react-native';
import { Stack } from 'expo-router';
export default function SalesMyReportsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'My Reports' }} />
      <Text>Sales - My Reports Screen</Text>
    </View>
  );
}
