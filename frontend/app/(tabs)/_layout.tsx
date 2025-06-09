import { Tabs } from 'expo-router';
import React from 'react';

// Import icons here, for example:
// import { Ionicons } from '@expo/vector-icons';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: Colors.light.tint, // Example: if you have a Colors.ts
        headerShown: false, // Usually handled by Stack navigators within each tab
      }}>
      <Tabs.Screen
        name="index" // This will refer to (tabs)/index.tsx
        options={{
          title: 'Dashboard',
          // tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />, // Example Icon
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          // tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />, // Example Icon
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          // tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />, // Example Icon
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          // tabBarIcon: ({ color }) => <Ionicons name="analytics" size={24} color={color} />, // Example Icon
        }}
      />
      {/* Add more tabs here as needed for different roles or common functionalities */}
    </Tabs>
  );
}
