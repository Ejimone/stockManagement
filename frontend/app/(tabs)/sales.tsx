import { Text, View } from 'react-native';
import { Stack } from 'expo-router';

export default function SalesTabScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'Sales' }} />
      <Text>Sales Tab Placeholder</Text>
    </View>
  );
}
