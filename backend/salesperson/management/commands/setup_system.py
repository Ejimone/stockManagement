from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.core.management import call_command
from salesperson.models import Product
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Initialize the Stock Management System with basic setup'

    def add_arguments(self, parser):
        parser.add_argument(
            '--create-superuser',
            action='store_true',
            help='Create a superuser interactively',
        )
        parser.add_argument(
            '--create-sample-products',
            action='store_true',
            help='Create sample products for testing',
        )
        parser.add_argument(
            '--create-salesperson',
            type=str,
            help='Create a salesperson with given email',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('=== Stock Management System Setup ===')
        )
        
        if options['create_superuser']:
            self.stdout.write('Creating superuser...')
            call_command('createsuperuser')
            
        if options['create_sample_products']:
            self.create_sample_products()
            
        if options['create_salesperson']:
            self.create_salesperson(options['create_salesperson'])
            
        if not any([options['create_superuser'], options['create_sample_products'], options['create_salesperson']]):
            self.print_setup_instructions()

    def create_sample_products(self):
        """Create sample products for testing"""
        sample_products = [
            {
                'name': 'iPhone 14 Pro',
                'description': 'Latest iPhone model with advanced features',
                'sku': 'IPHONE14PRO',
                'price': Decimal('999.99'),
                'stock_quantity': 50,
                'category': 'Electronics'
            },
            {
                'name': 'Samsung Galaxy S23',
                'description': 'High-end Android smartphone',
                'sku': 'GALAXYS23',
                'price': Decimal('899.99'),
                'stock_quantity': 30,
                'category': 'Electronics'
            },
            {
                'name': 'MacBook Air M2',
                'description': 'Apple laptop with M2 chip',
                'sku': 'MACBOOKAIRM2',
                'price': Decimal('1299.99'),
                'stock_quantity': 20,
                'category': 'Computers'
            },
            {
                'name': 'Dell XPS 13',
                'description': 'Premium Windows ultrabook',
                'sku': 'DELLXPS13',
                'price': Decimal('1199.99'),
                'stock_quantity': 15,
                'category': 'Computers'
            },
            {
                'name': 'AirPods Pro',
                'description': 'Wireless earbuds with noise cancellation',
                'sku': 'AIRPODSPRO',
                'price': Decimal('249.99'),
                'stock_quantity': 100,
                'category': 'Accessories'
            },
            {
                'name': 'Sony WH-1000XM4',
                'description': 'Premium noise-canceling headphones',
                'sku': 'SONYWH1000XM4',
                'price': Decimal('349.99'),
                'stock_quantity': 40,
                'category': 'Accessories'
            },
            {
                'name': 'iPad Pro 12.9"',
                'description': 'Professional tablet with M2 chip',
                'sku': 'IPADPRO129',
                'price': Decimal('1099.99'),
                'stock_quantity': 25,
                'category': 'Tablets'
            },
            {
                'name': 'Samsung Tab S8 Ultra',
                'description': 'Large Android tablet for productivity',
                'sku': 'TABS8ULTRA',
                'price': Decimal('1199.99'),
                'stock_quantity': 15,
                'category': 'Tablets'
            }
        ]
        
        created_count = 0
        for product_data in sample_products:
            product, created = Product.objects.get_or_create(
                sku=product_data['sku'],
                defaults=product_data
            )
            if created:
                created_count += 1
                
        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} sample products')
        )

    def create_salesperson(self, email):
        """Create a salesperson user"""
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.WARNING(f'User with email {email} already exists')
            )
            return
            
        first_name = input('First name: ')
        last_name = input('Last name: ')
        password = input('Password: ')
        
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=User.ROLE_SALESPERSON
        )
        
        self.stdout.write(
            self.style.SUCCESS(f'Created salesperson: {user.full_name} ({email})')
        )

    def print_setup_instructions(self):
        """Print setup instructions"""
        self.stdout.write(
            self.style.SUCCESS('\n=== Setup Instructions ===')
        )
        self.stdout.write('1. Create a superuser (Admin):')
        self.stdout.write('   python manage.py setup_system --create-superuser')
        self.stdout.write('')
        self.stdout.write('2. Create sample products for testing:')
        self.stdout.write('   python manage.py setup_system --create-sample-products')
        self.stdout.write('')
        self.stdout.write('3. Create a salesperson:')
        self.stdout.write('   python manage.py setup_system --create-salesperson salesperson@company.com')
        self.stdout.write('')
        self.stdout.write('4. Or use Django admin to manage users:')
        self.stdout.write('   python manage.py runserver')
        self.stdout.write('   Visit: http://127.0.0.1:8000/admin/')
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== API Endpoints ==='))
        self.stdout.write('Authentication: POST /api/auth/login/')
        self.stdout.write('Products: GET /api/products/')
        self.stdout.write('Sales: GET/POST /api/sales/')
        self.stdout.write('Users: GET/POST /api/users/ (Admin only)')
        self.stdout.write('Reports: GET /api/reports/dashboard/')
        self.stdout.write('')
