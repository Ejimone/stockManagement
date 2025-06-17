/**
 * Real-time notification service for admin payment updates
 */
import axios from "axios";
import * as tokenStorage from "./tokenStorage";

export interface PaymentNotification {
  id: number;
  sale_id: number;
  amount: number;
  payment_method: string;
  salesperson_name: string;
  created_at: string;
  sale_total_amount: number;
}

export interface NotificationService {
  startPolling: (onNewPayment: (payment: PaymentNotification) => void) => void;
  stopPolling: () => void;
  getRecentPayments: () => Promise<PaymentNotification[]>;
}

// We'll use the same API base URL detection logic
const getApiBaseUrl = (): string => {
  // Use the current ngrok URL
  return "https://658a-59-145-142-18.ngrok-free.app/api/";
};

class RealTimeNotificationService implements NotificationService {
  private intervalId: any = null;
  private lastCheckedTime: string | null = null;
  private isPolling = false;
  private pollingInterval = 30000; // 30 seconds

  private async makeApiCall(endpoint: string): Promise<any> {
    const { accessToken } = await tokenStorage.getToken();
    if (!accessToken) {
      throw new Error("No access token available");
    }

    const response = await axios.get(`${getApiBaseUrl()}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }

  async getRecentPayments(since?: string): Promise<PaymentNotification[]> {
    try {
      const params = new URLSearchParams();
      if (since) {
        params.append("created_after", since);
      } else {
        // Get payments from the last hour by default
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        params.append("created_after", oneHourAgo);
      }

      const data = await this.makeApiCall(`payments/?${params.toString()}`);
      return data.results || data;
    } catch (error) {
      console.error("Failed to fetch recent payments:", error);
      return [];
    }
  }

  startPolling(onNewPayment: (payment: PaymentNotification) => void): void {
    if (this.isPolling) {
      console.log("Notification polling already started");
      return;
    }

    this.isPolling = true;
    this.lastCheckedTime = new Date().toISOString();

    console.log("🔔 Starting real-time payment notifications");

    this.intervalId = setInterval(async () => {
      try {
        const recentPayments = await this.getRecentPayments(
          this.lastCheckedTime || undefined
        );

        if (recentPayments.length > 0) {
          console.log(`📧 Found ${recentPayments.length} new payment(s)`);

          // Process each new payment
          recentPayments.forEach((payment) => {
            onNewPayment(payment);
          });

          // Update the last checked time to the most recent payment
          this.lastCheckedTime = recentPayments[0].created_at;
        }
      } catch (error) {
        console.error("Error checking for new payments:", error);
      }
    }, this.pollingInterval);
  }

  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log("🔕 Stopped real-time payment notifications");
    }
  }

  setPollingInterval(intervalMs: number): void {
    this.pollingInterval = intervalMs;

    // Restart polling with new interval if currently polling
    if (this.isPolling) {
      this.stopPolling();
      // Note: This would require the callback to restart, so it's better to handle this in the component
    }
  }

  isCurrentlyPolling(): boolean {
    return this.isPolling;
  }
}

// Export singleton instance
export const notificationService = new RealTimeNotificationService();

// Notification display functions
export const showPaymentNotification = (payment: PaymentNotification) => {
  // For React Native, we'll use Alert or a toast library
  console.log("💰 New Payment Received!", {
    amount: payment.amount,
    salesperson: payment.salesperson_name,
    method: payment.payment_method,
    sale_id: payment.sale_id,
  });

  // You can extend this to use a proper notification library like:
  // - react-native-push-notification
  // - expo-notifications
  // - Or a custom in-app notification component
};

export default notificationService;
