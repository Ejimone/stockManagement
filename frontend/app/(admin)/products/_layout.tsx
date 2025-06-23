import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
// Consider using an icon library for a better UX
// import { Ionicons } from '@expo/vector-icons';

export default function AdminProductsStackLayout() {
  const router = useRouter();
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerRight: () => (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push("/(admin)/products/add")}
            >
              {/* <Ionicons name="add-circle-outline" size={28} color="#007AFF" /> */}
              <Text style={styles.headerButtonText}>Add</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          headerShown: false,
          // presentation: 'modal', // Optional: if you want it to slide up
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false, // Can be dynamically set in the screen component too
          // presentation: 'modal', // Optional
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 15,
    paddingVertical: 5,
  },
  headerButtonText: {
    color: "#007AFF", // iOS default blue
    fontSize: 17, // Standard iOS header button text size
    fontWeight: "600", // A bit bolder for emphasis
  },
});
