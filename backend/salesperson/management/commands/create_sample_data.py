from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from salesperson.models import Product, Sale, Payment, SaleItem
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample data for testing the Stock Management System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=5,
            help='Number of sample users to create'
        )
        parser.add_argument(
            '--products',
            type=int,
            default=20,
            help='Number of sample products to create'
        )
        parser.add_argument(
            '--sales',
            type=int,
            default=10,
            help='Number of sample sales to create'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))

        # Check if we have at least one admin user
        admin_exists = User.objects.filter(role=User.ROLE_ADMIN).exists()
        if not admin_exists:
            self.stdout.write(
                self.style.WARNING('No admin user found. Please create a superuser first:')
            )
            self.stdout.write('python manage.py setup_system --create-superuser')
            return
            
        # Get the first admin user for creating payments
        admin_user = User.objects.filter(role=User.ROLE_ADMIN).first()

        # Create sample salespersons
        salesperson_names = [
            ('John', 'Doe'),
            ('Jane', 'Smith'),
            ('Mike', 'Johnson'),
            ('Sarah', 'Williams'),
            ('David', 'Brown'),
        ]

        salespersons = []
        for i, (first_name, last_name) in enumerate(salesperson_names[:options['users']]):
            email = f'{first_name.lower()}.{last_name.lower()}@jonkech.com'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': f'{first_name.lower()}{last_name.lower()}',
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': User.ROLE_SALESPERSON,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created salesperson: {user.email}')
                )
            salespersons.append(user)

        # Create sample products
        product_data = [
            ('iPhone 14', 'Latest smartphone from Apple', 'IPHONE14', 999.99, 50, 'Electronics'),
            ('Samsung Galaxy S23', 'Android flagship smartphone', 'SAMS23', 899.99, 30, 'Electronics'),
            ('MacBook Air M2', 'Lightweight laptop with M2 chip', 'MBA-M2', 1199.99, 20, 'Electronics'),
            ('AirPods Pro', 'Wireless earbuds with noise cancellation', 'AIRPODS-PRO', 249.99, 100, 'Electronics'),
            ('Nike Air Max', 'Comfortable running shoes', 'NIKE-AM', 129.99, 80, 'Fashion'),
            ('Adidas Ultraboost', 'Premium running shoes', 'ADIDAS-UB', 179.99, 60, 'Fashion'),
            ('Coffee Beans Premium', 'High-quality arabica coffee beans', 'COFFEE-PREM', 24.99, 200, 'Food & Beverage'),
            ('Green Tea Organic', 'Organic green tea leaves', 'TEA-ORGANIC', 19.99, 150, 'Food & Beverage'),
            ('Vitamin D3', 'Essential vitamin supplement', 'VIT-D3', 12.99, 300, 'Health'),
            ('Protein Powder', 'Whey protein for fitness', 'PROTEIN', 49.99, 75, 'Health'),
            ('Yoga Mat', 'Non-slip exercise mat', 'YOGA-MAT', 39.99, 40, 'Sports'),
            ('Dumbbells Set', '20kg adjustable dumbbells', 'DUMBBELL', 89.99, 25, 'Sports'),
            ('Office Chair', 'Ergonomic office chair', 'CHAIR-ERG', 299.99, 15, 'Furniture'),
            ('Standing Desk', 'Height adjustable desk', 'DESK-STAND', 599.99, 10, 'Furniture'),
            ('Water Bottle', 'Stainless steel water bottle', 'BOTTLE-SS', 24.99, 120, 'Accessories'),
            ('Backpack', 'Travel backpack with laptop compartment', 'BACKPACK', 79.99, 50, 'Accessories'),
            ('Bluetooth Speaker', 'Portable wireless speaker', 'SPEAKER-BT', 59.99, 70, 'Electronics'),
            ('Power Bank', '20000mAh portable charger', 'POWERBANK', 34.99, 90, 'Electronics'),
            ('Sunglasses', 'UV protection sunglasses', 'SUNGLASSES', 89.99, 60, 'Fashion'),
            ('Watch', 'Digital smartwatch', 'WATCH-SMART', 199.99, 35, 'Electronics'),
        ]

        products = []
        for i, (name, desc, sku, price, stock, category) in enumerate(product_data[:options['products']]):
            product, created = Product.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'description': desc,
                    'price': Decimal(str(price)),
                    'stock_quantity': stock,
                    'category': category,
                }
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created product: {product.name}')
                )
            products.append(product)

        # Create sample sales
        payment_methods = [Sale.PAYMENT_METHOD_CASH, Sale.PAYMENT_METHOD_CREDIT, Sale.PAYMENT_METHOD_MOBILE_MONEY]
        customer_names = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Eve Davis']

        for i in range(options['sales']):
            salesperson = random.choice(salespersons)
            customer_name = random.choice(customer_names)
            payment_method = random.choice(payment_methods)
            
            # Select random products for this sale
            num_products = random.randint(1, 3)
            sale_products = random.sample(products, num_products)
            
            # Calculate total amount
            total_amount = Decimal('0.00')
            products_sold_data = []
            
            for product in sale_products:
                quantity = random.randint(1, 3)
                price_at_sale = product.price
                subtotal = quantity * price_at_sale
                total_amount += subtotal
                
                products_sold_data.append({
                    'product_id': product.id,
                    'name': product.name,
                    'quantity': quantity,
                    'price_at_sale': float(price_at_sale),
                    'subtotal': float(subtotal)
                })
            
            # Determine payment status
            if payment_method == Sale.PAYMENT_METHOD_CASH:
                amount_paid = total_amount
                payment_status = Sale.PAYMENT_STATUS_PAID
            elif payment_method == Sale.PAYMENT_METHOD_CREDIT:
                # For credit, randomly pay partial or nothing
                if random.choice([True, False]):
                    amount_paid = total_amount * Decimal(str(random.uniform(0.3, 0.8)))
                    payment_status = Sale.PAYMENT_STATUS_PARTIAL
                else:
                    amount_paid = Decimal('0.00')
                    payment_status = Sale.PAYMENT_STATUS_UNPAID
            else:  # Mobile Money
                amount_paid = total_amount
                payment_status = Sale.PAYMENT_STATUS_PAID
            
            sale = Sale.objects.create(
                salesperson=salesperson,
                customer_name=customer_name,
                customer_phone=f'+234{random.randint(7000000000, 9999999999)}',
                products_sold=products_sold_data,
                total_amount=total_amount,
                payment_method=payment_method,
                payment_status=payment_status,
                amount_paid=amount_paid,
                notes=f'Sample sale #{i+1}' if random.choice([True, False]) else ''
            )
            
            # Create SaleItem records (if using normalized approach)
            for product_data in products_sold_data:
                product = Product.objects.get(id=product_data['product_id'])
                SaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=product_data['quantity'],
                    price_at_sale=Decimal(str(product_data['price_at_sale']))
                )
                
                # Reduce product stock
                product.stock_quantity -= product_data['quantity']
                product.save()
            
            # Create payment record for partial payments
            if payment_status == Sale.PAYMENT_STATUS_PARTIAL and amount_paid > 0:
                Payment.objects.create(
                    sale=sale,
                    amount=amount_paid,
                    payment_method=payment_method,
                    recorded_by=admin_user,
                    notes='Initial payment'
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'Created sale: #{sale.id} - ₦{sale.total_amount}')
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created sample data:\n'
                f'- {User.objects.count()} users\n'
                f'- {Product.objects.count()} products\n'
                f'- {Sale.objects.count()} sales\n'
                f'- {Payment.objects.count()} payments'
            )
        )
        
        self.stdout.write(
            self.style.WARNING(
                f'\nLogin credentials:\n'
                f'Admin: admin@jonkech.com / admin123\n'
                f'Salesperson: john.doe@jonkech.com / password123'
            )
        )
