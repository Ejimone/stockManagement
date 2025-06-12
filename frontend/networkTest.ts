/**
 * Network Connection Test Script
 * Run this to test if the React Native app can connect to Django backend
 */

import axios from "axios";

const testUrls = [
  "http://10.0.2.2:8000/api/", // Android Emulator
  "http://localhost:8000/api/", // iOS Simulator / Web
  "http://127.0.0.1:8000/api/", // Alternative localhost
];

const testConnection = async (url: string) => {
  try {
    console.log(`🧪 Testing: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ SUCCESS: ${url}`);
    console.log(`   Status: ${response.status}`);
    console.log(
      `   Data: ${JSON.stringify(response.data).substring(0, 100)}...`
    );
    return true;
  } catch (error: any) {
    console.log(`❌ FAILED: ${url}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data}`);
    } else if (error.request) {
      console.log(`   Error: No response - ${error.message}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
    return false;
  }
};

const runNetworkTest = async () => {
  console.log("🚀 Starting Network Connection Test...");
  console.log("====================================");

  for (const url of testUrls) {
    await testConnection(url);
    console.log(""); // Empty line for readability
  }

  console.log("🏁 Network test completed!");
};

// Run the test
runNetworkTest().catch(console.error);
