#!/usr/bin/env python3

import requests
import json

# Test the payment summary API
url = "http://localhost:8000/api/payments/summary/"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("Payment Summary Response:")
        print(json.dumps(data, indent=2))
    else:
        print(f"Error: {response.text}")
        
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to server. Make sure Django server is running.")
except Exception as e:
    print(f"Error: {e}")
