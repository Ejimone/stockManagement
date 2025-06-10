#!/usr/bin/env python3

import requests

# First, try to authenticate
login_data = {"email": "admin@jonkech.com", "password": "admin123"}
response = requests.post("http://127.0.0.1:8000/api/auth/login/", json=login_data)

if response.status_code == 200:
    token = response.json()["access"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get payment summary
    summary_response = requests.get("http://127.0.0.1:8000/api/payments/summary/", headers=headers)
    if summary_response.status_code == 200:
        print("Payment Summary:", summary_response.json())
    else:
        print("Summary failed:", summary_response.text)
else:
    print("Login failed:", response.text)
