import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

interface ErrorBoundaryProps {
  error?: string | null;
  onRetry?: () => void;
  showRetry?: boolean;
  style?: any;
  children?: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  error,
  onRetry,
  showRetry = true,
  style,
  children,
}) => {
  if (!error) {
    return <>{children}</>;
  }

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const getErrorMessage = (errorText: string) => {
    // Simplify common error messages for users
    if (errorText.includes("Network Error") || errorText.includes("network")) {
      return "Network connection issue. Please check your internet connection.";
    }
    if (errorText.includes("401") || errorText.includes("Unauthorized")) {
      return "Session expired. Please log in again.";
    }
    if (errorText.includes("403") || errorText.includes("Forbidden")) {
      return "You don't have permission to access this resource.";
    }
    if (errorText.includes("404") || errorText.includes("Not Found")) {
      return "The requested resource was not found.";
    }
    if (
      errorText.includes("500") ||
      errorText.includes("Internal Server Error")
    ) {
      return "Server error. Please try again later.";
    }
    // Return a simplified version of the error
    return "Something went wrong. Please try again.";
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Oops!</Text>
      <Text style={styles.errorMessage}>{getErrorMessage(error)}</Text>

      {showRetry && onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {__DEV__ && (
        <TouchableOpacity
          style={styles.debugButton}
          onPress={() => Alert.alert("Debug Info", error)}
        >
          <Text style={styles.debugButtonText}>Show Debug Info</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface NetworkErrorProps {
  onRetry?: () => void;
  style?: any;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({
  onRetry,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorIcon}>📶</Text>
      <Text style={styles.errorTitle}>No Connection</Text>
      <Text style={styles.errorMessage}>
        Please check your internet connection and try again.
      </Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
  style?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Data",
  message = "There's nothing here yet.",
  icon = "📭",
  actionText,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.errorIcon}>{icon}</Text>
      <Text style={styles.errorTitle}>{title}</Text>
      <Text style={styles.errorMessage}>{message}</Text>

      {actionText && onAction && (
        <TouchableOpacity style={styles.retryButton} onPress={onAction}>
          <Text style={styles.retryButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  debugButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  debugButtonText: {
    color: "#666",
    fontSize: 12,
  },
});
