import React from "react";
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  DimensionValue,
} from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  text?: string;
  color?: string;
  style?: ViewStyle;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "large",
  text = "Loading...",
  color = "#007AFF",
  style,
  fullScreen = false,
}) => {
  const containerStyle = fullScreen
    ? styles.fullScreenContainer
    : styles.container;

  return (
    <View style={[containerStyle, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

// Card skeleton for dashboard metrics
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardSkeletonContent}>
        <SkeletonLoader width="70%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="50%" height={24} style={{ marginBottom: 4 }} />
        <SkeletonLoader width="80%" height={12} />
      </View>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
    </View>
  );
};

// List item skeleton for sales, products, etc.
export const ListItemSkeleton: React.FC = () => {
  return (
    <View style={styles.listItemSkeleton}>
      <SkeletonLoader
        width={50}
        height={50}
        borderRadius={8}
        style={{ marginRight: 12 }}
      />
      <View style={styles.listItemSkeletonContent}>
        <SkeletonLoader width="80%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonLoader width="60%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonLoader width="40%" height={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  skeleton: {
    backgroundColor: "#E1E9EE",
    opacity: 0.8,
  },
  cardSkeleton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardSkeletonContent: {
    flex: 1,
  },
  listItemSkeleton: {
    backgroundColor: "#fff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemSkeletonContent: {
    flex: 1,
  },
});
