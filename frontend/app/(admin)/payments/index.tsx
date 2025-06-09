import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function AdminPaymentsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Payments Screen</Text>
      {/* Display payments list, summaries, or links to payment processing */}
      {/* <Link href="/(admin)/payments/details/1">View Payment 1 Details</Link> */}
    </View>
  );
}
