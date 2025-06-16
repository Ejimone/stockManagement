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
    // console.error("Connection test failed:", error);
    // let errorMessage = "Unknown error";
    // if (error.response) {
    //   // Server responded with a status code outside the 2xx range
    //   errorMessage = `Server error: ${error.response.status} - ${JSON.stringify(
    //     error.response.data
    //   )}`;
    // } else if (error.request) {
    //   // Request was made but no response received
    //   errorMessage =
    //     "No response from server. The server may be down or the URL is incorrect.";
    // } else {
    //   // Error in setting up the request
    //   errorMessage = `Request error: ${error.message}`;
    // }
    // return {
    //   success: false,
    //   message: errorMessage,
    // };
  }
};

/**
 * Debug helper to test ngrok-only configuration
 */
export const debugConnection = async (): Promise<void> => {
  console.log("🛠️ Starting ngrok-only connection debug...");

  // Test multiple potential backend URLs to find which one works
  // NGROK-ONLY configuration - works on all devices!
  const baseUrls = [
    // ngrok URLs (work everywhere: emulator, physical devices, web!)
    "https://658a-59-145-142-18.ngrok-free.app/api/", // ngrok tunnel with API endpoint
    "https://658a-59-145-142-18.ngrok-free.app/", // ngrok base URL
  ];

  console.log("📡 Testing ngrok-only backend URLs...");
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
      `✅ ngrok-only connection debug completed - Working URL found: ${workingUrl}`
    );
    console.log("🌐 Your app can now connect from any device via ngrok!");
  } else {
    console.log(
      "❌ ngrok-only connection debug completed - No working URLs found"
    );
    console.log("💡 Troubleshooting suggestions:");
    console.log(
      "1. Make sure Django server is running: python3 manage.py runserver 0.0.0.0:8000"
    );
    console.log("2. Make sure ngrok tunnel is active: ngrok http 8000");
    console.log(
      "3. Check ngrok status: curl http://localhost:4040/api/tunnels"
    );
    console.log("4. Update ngrok URLs: ./update-ngrok-config.sh");
    console.log(
      "5. Test API directly: curl https://YOUR-NGROK-URL.ngrok-free.app/api/"
    );
  }

  console.log("🛠️ ngrok-only connection debug completed");
};

export default { testConnection, debugConnection };
