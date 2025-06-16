/**
 * Test script to verify ngrok-only configuration
 * Run this to test if the React Native app can connect to ngrok
 */

const testNgrokConnection = async () => {
  const ngrokUrl = "https://658a-59-145-142-18.ngrok-free.app/api/";

  console.log("🧪 Testing ngrok-only configuration...");
  console.log("🌐 ngrok URL:", ngrokUrl);

  try {
    const response = await fetch(ngrokUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ SUCCESS: ngrok connection working!");
      console.log("📊 API Response:", data);
      return true;
    } else {
      console.log("❌ FAILED: ngrok returned status", response.status);
      return false;
    }
  } catch (error) {
    console.log("❌ FAILED: ngrok connection error", error.message);
    return false;
  }
};

// Run the test
testNgrokConnection()
  .then((success) => {
    if (success) {
      console.log("🎉 ngrok-only configuration is ready!");
      console.log("📱 Your React Native app should now work on any device");
    } else {
      console.log("⚠️ ngrok configuration needs attention");
      console.log("💡 Make sure ngrok tunnel is running: ngrok http 8000");
    }
  })
  .catch(console.error);
