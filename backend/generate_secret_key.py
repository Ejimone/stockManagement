#!/usr/bin/env python3
"""
Django Secret Key Generator
Run this script to generate a new secret key for production
"""

import secrets
import string

def generate_secret_key(length=50):
    """Generate a random secret key suitable for Django"""
    alphabet = string.ascii_letters + string.digits + '!@#$%^&*(-_=+)'
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(length))
    return secret_key

if __name__ == "__main__":
    new_key = generate_secret_key()
    print("🔐 Your new Django SECRET_KEY:")
    print(f"SECRET_KEY={new_key}")
    print("\n💡 Copy this and use it as an environment variable in your deployment platform!")
