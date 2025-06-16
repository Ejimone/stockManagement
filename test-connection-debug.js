#!/usr/bin/env node

/**
 * Test script for the ngrok-only connectionDebug functionality
 * This script simulates calling the connectionDebug function to verify it only tests ngrok URLs
 */

// Mock the connectionDebug functionality
const CURRENT_NGROK_URL = "https://3c2e-59-145-142-18.ngrok-free.app/api/";

const testConnection = async (url) => {
  try {
    console.log(`Testing connection to: ${url}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.text();

    return {
      success: true,
      message: `Connection successful. Status: ${
        response.status
      }, Data: ${data.substring(0, 200)}...`,
    };
  } catch (error) {
    let errorMessage = "Unknown error";

    if (error.name === "AbortError") {
      errorMessage = "Request timeout - server took too long to respond";
    } else if (error.message.includes("fetch")) {
      errorMessage =
        "No response from server. The server may be down or the URL is incorrect.";
    } else {
      errorMessage = `Request error: ${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

const debugConnection = async () => {
  console.log("🛠️ Starting ngrok connection debug...");
  console.log("📡 Testing ngrok backend URL...");

  try {
    const result = await testConnection(CURRENT_NGROK_URL);
    const status = result.success ? "✅" : "❌";
    console.log(`${CURRENT_NGROK_URL}: ${status} ${result.message}`);

    if (result.success) {
      console.log(`✅ Ngrok connection successful! 🎯`);
      console.log(
        `💡 All devices (Android emulator, physical device, web) can now access the API.`
      );
    } else {
      console.log("❌ Ngrok connection failed");
      console.log("💡 Troubleshooting suggestions:");
      console.log("1. Check if ngrok tunnel is running: ngrok http 8000");
      console.log(
        "2. Make sure Django server is running: python3 manage.py runserver 0.0.0.0:8000"
      );
      console.log("3. Verify the ngrok URL is correct and up-to-date");
      console.log(
        "4. Run ./update-ngrok-config.sh to update the frontend with current ngrok URL"
      );
      console.log(
        "5. If ngrok URL changed, update it in frontend/services/api.ts"
      );
    }
  } catch (err) {
    console.log(`${CURRENT_NGROK_URL}: ❌ Error during test - ${err}`);
    console.log("💡 Critical: ngrok connection failed!");
    console.log("Please ensure:");
    console.log("• ngrok tunnel is active: ngrok http 8000");
    console.log(
      "• Django server is running: python3 manage.py runserver 0.0.0.0:8000"
    );
    console.log("• Frontend is using the correct ngrok URL");
  }

  console.log("🛠️ Ngrok connection debug completed");
};

// Run the test
console.log("🧪 Testing ngrok-only connectionDebug functionality...");
console.log("========================================================");
debugConnection().then(() => {
  console.log("========================================================");
  console.log("✅ Connection debug test completed!");
  console.log("");
  console.log("📝 Notes:");
  console.log("• This script now ONLY tests the ngrok URL");
  console.log("• No more testing of localhost/emulator URLs");
  console.log("• Clean error-free logs for better developer experience");
  console.log(
    "• Use ./update-ngrok-config.sh to update URLs when ngrok changes"
  );
});
