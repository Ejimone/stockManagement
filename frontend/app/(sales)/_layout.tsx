import { Tabs } from 'expo-router';
import React from 'react';
// Import icons here, e.g., from @expo/vector-icons
// import { Ionicons } from '@expo/vector-icons';

export default function SalesTabLayout() {
  return (
    <Tabs
      screenOptions={{
        // tabBarActiveTintColor: 'green', // Example color
        headerShown: true, // Show header for sales stack screens by default
      }}>
      <Tabs.Screen
        name="dashboard" // This will refer to (sales)/dashboard/index.tsx
        options={{
          title: 'Dashboard',
          // tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products" // This will refer to (sales)/products/index.tsx (View List)
        options={{
          title: 'Products',
          // tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales" // This will refer to (sales)/sales/index.tsx (View Own Sales & Create)
        options={{
          title: 'My Sales',
          // tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports" // This will refer to (sales)/reports/index.tsx
        options={{
          title: 'My Reports',
          // tabBarIcon: ({ color, size }) => <Ionicons name="analytics-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
