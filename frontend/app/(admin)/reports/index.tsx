import { Text, View } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function AdminReportsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Admin Reports Screen</Text>
      {/* Display various reports or links to specific report views */}
      {/* <Link href="/(admin)/reports/sales-summary">View Sales Summary Report</Link> */}
    </View>
  );
}
