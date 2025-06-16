import axios from "axios";

/**
 * A utility to test API connectivity
 * @param url The URL to test connectivity to
 * @returns Promise with the result of the connection test
 */
export const testConnection = async (
  url: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Testing connection to: ${url}`);
    // Using a timeout of 5 seconds to avoid waiting too long
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return {
      success: true,
      message: `Connection successful. Status: ${
        response.status
      }, Data: ${JSON.stringify(response.data).substring(0, 200)}...`,
    };
  } catch (error: any) {
    // Log detailed error information for debugging
    console.error("Connection test failed:", error);
    let errorMessage = "Unknown error";

    if (error.response) {
      // Server responded with a status code outside the 2xx range
      errorMessage = `Server error: ${error.response.status} - ${JSON.stringify(
        error.response.data
      )}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage =
        "No response from server. The server may be down or the URL is incorrect.";
    } else {
      // Error in setting up the request
      errorMessage = `Request error: ${error.message}`;
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
};

/**
 * Debug helper to test different URLs and configurations
 */
export const debugConnection = async (): Promise<void> => {
  console.log("🛠️ Starting connection debug...");

  // Test multiple potential backend URLs to find which one works
  // Priority order: Physical devices first, then emulators, then local development
  const baseUrls = [
    // ngrok URLs (work everywhere!)
    "https://3c2e-59-145-142-18.ngrok-free.app/api/", // ngrok tunnel
    "https://3c2e-59-145-142-18.ngrok-free.app/", // ngrok base
    
    // Physical device URLs (most common for real testing)
    "http://172.16.0.59:8000/api/", // Local IP with API endpoint (preferred)
    "http://172.16.0.59:8000/", // Local IP base

    // Android Emulator URLs
    "http://10.0.2.2:8000/api/", // Android emulator with API endpoint
    "http://10.0.2.2:8000/", // Android emulator base

    // Local development URLs
    "http://localhost:8000/api/", // Local with API endpoint
    "http://localhost:8000/", // Local base
    "http://127.0.0.1:8000/api/", // Alternative local with API
    "http://127.0.0.1:8000/", // Alternative local base
  ];

  console.log("📡 Testing multiple backend URLs...");
  let workingUrl: string | null = null;

  for (const url of baseUrls) {
    try {
      const result = await testConnection(url);
      const status = result.success ? "✅" : "❌";
      console.log(`${url}: ${status} ${result.message}`);

      if (result.success && !workingUrl) {
        workingUrl = url;
        console.log(`🎯 Found working URL: ${url}`);
      }
    } catch (err) {
      console.log(`${url}: ❌ Error during test`);
    }
  }

  if (workingUrl) {
    console.log(
      `✅ Connection debug completed - Working URL found: ${workingUrl}`
    );
  } else {
    console.log("❌ Connection debug completed - No working URLs found");
    console.log("💡 Suggestions:");
    console.log(
      "1. Make sure Django server is running: python3 manage.py runserver 0.0.0.0:8000"
    );
    console.log(
      "2. For PHYSICAL DEVICE: Your computer and phone must be on the same WiFi network"
    );
    console.log(
      "3. For PHYSICAL DEVICE: Use your computer's IP address (172.16.0.59:8000)"
    );
    console.log("4. For Android Emulator: Use 10.0.2.2:8000");
    console.log("5. For iOS Simulator: Use localhost:8000");
    console.log(
      "6. Check your computer's firewall settings - port 8000 must be accessible"
    );
    console.log(
      "7. Verify your computer's IP: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    );
  }

  console.log("🛠️ Connection debug completed");
};

export default { testConnection, debugConnection };
