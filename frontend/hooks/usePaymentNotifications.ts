/**
 * React hook for real-time payment notifications
 */
import { useEffect, useCallback, useRef } from "react";
import { Alert } from "react-native";
import {
  notificationService,
  PaymentNotification,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";

interface UseNotificationsOptions {
  enabled?: boolean;
  onNewPayment?: (payment: PaymentNotification) => void;
  showAlert?: boolean;
  pollingInterval?: number;
}

export const usePaymentNotifications = (
  options: UseNotificationsOptions = {}
) => {
  const { user } = useAuth();
  const {
    enabled = true,
    onNewPayment,
    showAlert = true,
    pollingInterval = 30000,
  } = options;

  const isAdminRef = useRef(user?.role === "Admin");
  const callbackRef = useRef(onNewPayment);

  // Update refs when props change
  useEffect(() => {
    isAdminRef.current = user?.role === "Admin";
    callbackRef.current = onNewPayment;
  }, [user?.role, onNewPayment]);

  const handleNewPayment = useCallback(
    (payment: PaymentNotification) => {
      console.log("📱 New payment notification:", payment);

      // Show alert notification if enabled
      if (showAlert) {
        const amountNum =
          typeof payment.amount === "number"
            ? payment.amount
            : Number(payment.amount) || 0;
        Alert.alert(
          "💰 New Payment Received!",
          `₦${amountNum.toFixed(2)} from ${payment.salesperson_name}\n` +
            `Payment Method: ${payment.payment_method}\n` +
            `Sale ID: ${payment.sale_id}`,
          [
            {
              text: "OK",
              style: "default",
            },
          ]
        );
      }

      // Call custom callback if provided
      if (callbackRef.current) {
        callbackRef.current(payment);
      }
    },
    [showAlert]
  );

  useEffect(() => {
    // Only start notifications for admin users
    if (!enabled || !isAdminRef.current) {
      return;
    }

    console.log("🔔 Starting payment notifications for admin");
    notificationService.startPolling(handleNewPayment);

    // Cleanup function to stop polling when component unmounts or user changes
    return () => {
      console.log("🔕 Stopping payment notifications");
      notificationService.stopPolling();
    };
  }, [enabled, handleNewPayment]);

  // Stop notifications when user logs out or is no longer admin
  useEffect(() => {
    if (!user || user.role !== "Admin") {
      notificationService.stopPolling();
    }
  }, [user]);

  return {
    isPolling: notificationService.isCurrentlyPolling(),
    startPolling: () => notificationService.startPolling(handleNewPayment),
    stopPolling: () => notificationService.stopPolling(),
  };
};

export default usePaymentNotifications;
