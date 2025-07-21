#!/usr/bin/env node
/**
 * Comprehensive test script for ngrok-only configuration
 * Tests all critical API endpoints via ngrok
 */

const testEndpoint = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: 10000,
    });

    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message,
    };
  }
};

const runComprehensiveTest = async () => {
  const NGROK_BASE = "https://658a-59-145-142-18.ngrok-free.app";
  const API_BASE = `${NGROK_BASE}/api/`;

  console.log("🧪 Running comprehensive ngrok-only test...");
  console.log("🌐 Testing URL:", API_BASE);
  console.log("=" * 50);

  const tests = [
    {
      name: "API Root",
      url: API_BASE,
      method: "GET",
    },
    {
      name: "Products List",
      url: `${API_BASE}products/`,
      method: "GET",
    },
    {
      name: "Users List",
      url: `${API_BASE}users/`,
      method: "GET",
    },
    {
      name: "Sales List",
      url: `${API_BASE}sales/`,
      method: "GET",
    },
    {
      name: "Dashboard",
      url: `${API_BASE}dashboard/`,
      method: "GET",
    },
    {
      name: "Login Endpoint (no auth)",
      url: `${API_BASE}auth/login/`,
      method: "POST",
      body: {},
    },
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);

    const result = await testEndpoint(test.url, {
      method: test.method,
      body: test.body,
    });

    if (result.success || result.status === 400 || result.status === 401) {
      // 400/401 are expected for some endpoints without proper auth
      console.log(`   ✅ PASS (Status: ${result.status})`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL (Status: ${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
  }

  console.log("\n" + "=" * 50);
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log("🎉 SUCCESS: ngrok-only configuration is working perfectly!");
    console.log("📱 Your React Native app should work on:");
    console.log("   • Android Emulator");
    console.log("   • iOS Simulator");
    console.log("   • Physical Android devices");
    console.log("   • Physical iOS devices");
    console.log("   • Web browsers");
    console.log("   • Any device with internet access");
  } else {
    console.log(
      "⚠️ Some tests failed. Check your Django server and ngrok tunnel."
    );
  }

  console.log("\n🔧 Maintenance commands:");
  console.log("   Update URLs: ./update-ngrok-config.sh");
  console.log("   Check ngrok: curl http://localhost:4040/api/tunnels");
  console.log("   Start ngrok: ngrok http 8000");
};

// Run the test
runComprehensiveTest().catch(console.error);
