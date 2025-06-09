import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin User Detail Screen</Text>
      <Text>User ID: {id}</Text>
      {/* Add form for editing or display details here */}
    </View>
  );
}
