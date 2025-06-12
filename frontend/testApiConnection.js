// Test script to verify API connection
const API_BASE_URL = "http://172.16.0.59:8000/api/";

async function testConnection() {
  console.log("Testing API connection to:", API_BASE_URL);

  try {
    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API connection successful!");
      console.log("Response data:", JSON.stringify(data, null, 2));
    } else {
      console.log("❌ API connection failed with status:", response.status);
      const errorText = await response.text();
      console.log("Error response:", errorText);
    }
  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("Full error:", error);
  }
}

// Test login endpoint
async function testLogin() {
  console.log("\n--- Testing Login Endpoint ---");

  try {
    const response = await fetch(API_BASE_URL + "auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuser",
        password: "testpass",
      }),
    });

    console.log("Login response status:", response.status);

    if (response.status === 400 || response.status === 401) {
      console.log(
        "✅ Login endpoint is accessible (expected 400/401 for invalid credentials)"
      );
    } else {
      const data = await response.json();
      console.log("Login response:", data);
    }
  } catch (error) {
    console.log("❌ Login test error:", error.message);
  }
}

// Run tests
testConnection().then(() => testLogin());
