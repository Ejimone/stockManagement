#!/usr/bin/env python3

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append('/Users/evidenceejimone/daddy/backend')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from salesperson.models import User, Sale
from django.db.models import Sum

# Get the user Banx@gmail.com
user = User.objects.get(email='Banx@gmail.com')
sales_queryset = Sale.objects.filter(salesperson=user)

print(f"User: {user.email}")
print(f"Total sales: {sales_queryset.count()}")

# Check all sales details
print("\nAll sales:")
for sale in sales_queryset:
    print(f"Sale {sale.id}: total={sale.total_amount}, paid={sale.amount_paid}, balance={sale.balance}, status='{sale.payment_status}', method='{sale.payment_method}'")

# Check credits over 1000 with both conditions
print("\nCredits over 1000 analysis:")
unpaid_over_1000 = sales_queryset.filter(payment_status='Unpaid', balance__gte=1000)
partial_over_1000 = sales_queryset.filter(payment_status='Partial', balance__gte=1000)

print(f"Unpaid sales over 1000: {unpaid_over_1000.count()}")
for sale in unpaid_over_1000:
    print(f"  Sale {sale.id}: balance={sale.balance}")

print(f"Partial sales over 1000: {partial_over_1000.count()}")  
for sale in partial_over_1000:
    print(f"  Sale {sale.id}: balance={sale.balance}")

# Calculate total
total_credits_over_1000 = sales_queryset.filter(
    payment_status__in=['Unpaid', 'Partial'], 
    balance__gte=1000
).aggregate(total=Sum('balance'))['total'] or 0

print(f"\nTotal credits over 1000: {total_credits_over_1000}")
