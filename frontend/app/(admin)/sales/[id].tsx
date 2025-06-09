import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function AdminSaleDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Sale Detail Screen</Text>
      <Text>Sale ID: {id}</Text>
      {/* Display sale details, allow editing or actions */}
    </View>
  );
}
