#!/usr/bin/env python3

import requests
import json

# Test script to check API endpoints
BASE_URL = "http://127.0.0.1:8000/api"

def get_auth_token():
    """Get auth token for Banx user"""
    login_data = {
        "email": "Banx@gmail.com", 
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    if response.status_code == 200:
        return response.json()["access"]
    else:
        print(f"Login failed: {response.text}")
        return None

def test_payments_api():
    """Test payments API with different filters"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Payments API ===")
    
    # Test 1: All payments
    print("\n1. All payments:")
    response = requests.get(f"{BASE_URL}/payments/", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Count: {len(data.get('results', data))}")
    print(f"Data: {json.dumps(data, indent=2)}")
    
    # Test 2: Completed payments only
    print("\n2. Completed payments:")
    response = requests.get(f"{BASE_URL}/payments/?status=Completed", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Count: {len(data.get('results', data))}")
    print(f"Data: {json.dumps(data, indent=2)}")

def test_sales_api():
    """Test sales API with different filters"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Sales API ===")
    
    # Test 1: All sales
    print("\n1. All sales:")
    response = requests.get(f"{BASE_URL}/sales/", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Count: {len(data.get('results', data))}")
    
    # Test 2: Unpaid sales
    print("\n2. Unpaid sales:")
    response = requests.get(f"{BASE_URL}/sales/?payment_status=Unpaid", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Count: {len(data.get('results', data))}")
    
    # Test 3: Partial sales
    print("\n3. Partial sales:")
    response = requests.get(f"{BASE_URL}/sales/?payment_status=Partial", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Count: {len(data.get('results', data))}")

def test_summary_api():
    """Test payment summary API"""
    token = get_auth_token()
    if not token:
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n=== Testing Payment Summary API ===")
    response = requests.get(f"{BASE_URL}/payments/summary/", headers=headers)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Data: {json.dumps(data, indent=2)}")

if __name__ == "__main__":
    test_summary_api()
    test_payments_api()
    test_sales_api()
