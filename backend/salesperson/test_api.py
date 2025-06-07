"""
Comprehensive API tests for the Stock Management System
"""
import json
from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from salesperson.models import Product, Sale, Payment, SaleItem

User = get_user_model()


class AuthenticationAPITestCase(APITestCase):
    """Test authentication endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            first_name='Sales',
            last_name='Person',
            role='Salesperson'
        )
    
    def test_login_success(self):
        """Test successful login"""
        url = reverse('api_login')
        data = {'email': 'admin@test.com', 'password': 'testpass123'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['role'], 'Admin')
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        url = reverse('api_login')
        data = {'email': 'admin@test.com', 'password': 'wrongpass'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_current_user_endpoint(self):
        """Test current user endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_current_user')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'admin@test.com')


class ProductAPITestCase(APITestCase):
    """Test product management endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            role='Salesperson'
        )
        self.product = Product.objects.create(
            name='Test Product',
            description='Test Description',
            sku='TEST-001',
            price=Decimal('99.99'),
            stock_quantity=100,
            category='Test Category'
        )
    
    def test_list_products_authenticated(self):
        """Test listing products as authenticated user"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_product_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_list_products_unauthenticated(self):
        """Test listing products without authentication"""
        url = reverse('api_product_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_create_product_admin(self):
        """Test creating product as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_product_list')
        data = {
            'name': 'New Product',
            'description': 'New Description',
            'sku': 'NEW-001',
            'price': '149.99',
            'stock_quantity': 50,
            'category': 'New Category'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 2)
    
    def test_create_product_salesperson_forbidden(self):
        """Test creating product as salesperson (should be forbidden)"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_product_list')
        data = {
            'name': 'New Product',
            'sku': 'NEW-001',
            'price': '149.99',
            'stock_quantity': 50
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_product_filters(self):
        """Test product filtering"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_product_list')
        
        # Test category filter
        response = self.client.get(url, {'category': 'Test Category'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # Test search filter
        response = self.client.get(url, {'search': 'Test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class SaleAPITestCase(APITestCase):
    """Test sales management endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            role='Salesperson'
        )
        self.product1 = Product.objects.create(
            name='Product 1',
            sku='PROD-001',
            price=Decimal('50.00'),
            stock_quantity=100
        )
        self.product2 = Product.objects.create(
            name='Product 2',
            sku='PROD-002',
            price=Decimal('75.00'),
            stock_quantity=50
        )
    
    def test_create_sale_success(self):
        """Test successful sale creation"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_sale_list')
        data = {
            'customer_name': 'Test Customer',
            'customer_phone': '1234567890',
            'payment_method': 'Cash',
            'amount_paid': '125.00',
            'products_sold_data': [
                {'product_id': self.product1.id, 'quantity': 1},
                {'product_id': self.product2.id, 'quantity': 1}
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Sale.objects.count(), 1)
        
        # Check stock was reduced
        self.product1.refresh_from_db()
        self.product2.refresh_from_db()
        self.assertEqual(self.product1.stock_quantity, 99)
        self.assertEqual(self.product2.stock_quantity, 49)
    
    def test_create_sale_insufficient_stock(self):
        """Test sale creation with insufficient stock"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_sale_list')
        data = {
            'customer_name': 'Test Customer',
            'payment_method': 'Cash',
            'amount_paid': '50.00',
            'products_sold_data': [
                {'product_id': self.product1.id, 'quantity': 101}  # More than available
            ]
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)
        
        # Check stock wasn't reduced
        self.product1.refresh_from_db()
        self.assertEqual(self.product1.stock_quantity, 100)
    
    def test_list_sales_role_based(self):
        """Test sales listing with role-based filtering"""
        # Create sales for different users
        Sale.objects.create(
            salesperson=self.admin_user,
            customer_name='Admin Sale',
            total_amount=Decimal('100.00'),
            payment_method='cash',
            amount_paid=Decimal('100.00')
        )
        Sale.objects.create(
            salesperson=self.salesperson_user,
            customer_name='Salesperson Sale',
            total_amount=Decimal('150.00'),
            payment_method='credit',
            amount_paid=Decimal('75.00')
        )
        
        # Admin should see all sales
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_sale_list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
        
        # Salesperson should only see their own sales
        self.client.force_authenticate(user=self.salesperson_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['customer_name'], 'Salesperson Sale')


class PaymentAPITestCase(APITestCase):
    """Test payment management endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            role='Salesperson'
        )
        self.sale = Sale.objects.create(
            salesperson=self.salesperson_user,
            customer_name='Test Customer',
            total_amount=Decimal('200.00'),
            payment_method='credit',
            amount_paid=Decimal('100.00'),
            balance=Decimal('100.00'),
            payment_status='Partial'
        )
    
    def test_create_payment_admin(self):
        """Test payment creation by admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_payment_list')
        data = {
            'sale': self.sale.id,
            'amount': '50.00',
            'payment_method': 'Cash',
            'reference_number': 'REF123'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Payment.objects.count(), 1)
        
        # Check sale balance was updated
        self.sale.refresh_from_db()
        self.assertEqual(self.sale.balance, Decimal('50.00'))
    
    def test_create_payment_salesperson_forbidden(self):
        """Test payment creation by salesperson (should be forbidden)"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_payment_list')
        data = {
            'sale': self.sale.id,
            'amount': '50.00',
            'payment_method': 'cash'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_payment_exceeds_balance(self):
        """Test payment amount exceeding sale balance"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_payment_list')
        data = {
            'sale': self.sale.id,
            'amount': '150.00',  # More than balance
            'payment_method': 'cash'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserManagementAPITestCase(APITestCase):
    """Test user management endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            role='Salesperson'
        )
    
    def test_list_users_admin(self):
        """Test listing users as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_user_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_list_users_salesperson_forbidden(self):
        """Test listing users as salesperson (should be forbidden)"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_user_list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_create_user_admin(self):
        """Test creating user as admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_user_list')
        data = {
            'email': 'newuser@test.com',
            'password': 'newpass123',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'Salesperson'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 3)


class ReportsAPITestCase(APITestCase):
    """Test reporting endpoints"""
    
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            role='Admin'
        )
        self.salesperson_user = User.objects.create_user(
            email='sales@test.com',
            password='testpass123',
            role='Salesperson'
        )
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            price=Decimal('100.00'),
            stock_quantity=10
        )
        self.sale = Sale.objects.create(
            salesperson=self.salesperson_user,
            customer_name='Test Customer',
            total_amount=Decimal('200.00'),
            payment_method='cash',
            amount_paid=Decimal('200.00'),
            payment_status='paid'
        )
    
    def test_dashboard_admin(self):
        """Test dashboard endpoint for admin"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_sales_today', response.data)
        self.assertIn('total_products', response.data)
    
    def test_dashboard_salesperson(self):
        """Test dashboard endpoint for salesperson"""
        self.client.force_authenticate(user=self.salesperson_user)
        url = reverse('api_dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('my_sales_today', response.data)
        self.assertNotIn('total_products', response.data)
    
    def test_sales_report(self):
        """Test sales report endpoint"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_sales_report')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('summary', response.data)
        self.assertIn('payment_methods', response.data)
    
    def test_inventory_report_admin_only(self):
        """Test inventory report is admin only"""
        # Admin access
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('api_inventory_report')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Salesperson forbidden
        self.client.force_authenticate(user=self.salesperson_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ModelTestCase(TestCase):
    """Test model methods and properties"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.product = Product.objects.create(
            name='Test Product',
            sku='TEST-001',
            price=Decimal('100.00'),
            stock_quantity=10
        )
    
    def test_user_full_name_property(self):
        """Test user full_name property"""
        self.assertEqual(self.user.full_name, 'Test User')
    
    def test_user_str_method(self):
        """Test user string representation"""
        self.assertEqual(str(self.user), 'Test User (test@test.com)')
    
    def test_product_str_method(self):
        """Test product string representation"""
        self.assertEqual(str(self.product), 'Test Product (TEST-001) - Stock: 10')
    
    def test_sale_balance_calculation(self):
        """Test sale balance calculation"""
        sale = Sale.objects.create(
            salesperson=self.user,
            customer_name='Test Customer',
            total_amount=Decimal('200.00'),
            payment_method='credit',
            amount_paid=Decimal('150.00')
        )
        self.assertEqual(sale.balance, Decimal('50.00'))
    
    def test_sale_payment_status_auto_update(self):
        """Test sale payment status auto-update"""
        # Fully paid sale
        sale_paid = Sale.objects.create(
            salesperson=self.user,
            customer_name='Test Customer',
            total_amount=Decimal('100.00'),
            payment_method='Cash',
            amount_paid=Decimal('100.00')
        )
        self.assertEqual(sale_paid.payment_status, 'Paid')
        
        # Partially paid sale
        sale_partial = Sale.objects.create(
            salesperson=self.user,
            customer_name='Test Customer',
            total_amount=Decimal('200.00'),
            payment_method='Credit',
            amount_paid=Decimal('100.00')
        )
        self.assertEqual(sale_partial.payment_status, 'Partial')
        
        # Unpaid sale
        sale_unpaid = Sale.objects.create(
            salesperson=self.user,
            customer_name='Test Customer',
            total_amount=Decimal('100.00'),
            payment_method='credit',
            amount_paid=Decimal('0.00')
        )
        self.assertEqual(sale_unpaid.payment_status, 'Unpaid')
    
    def test_sale_item_subtotal(self):
        """Test sale item subtotal calculation"""
        sale = Sale.objects.create(
            salesperson=self.user,
            customer_name='Test Customer',
            total_amount=Decimal('0.00'),
            payment_method='cash'
        )
        sale_item = SaleItem.objects.create(
            sale=sale,
            product=self.product,
            quantity=2,
            price_at_sale=Decimal('50.00')
        )
        self.assertEqual(sale_item.subtotal, Decimal('100.00'))
