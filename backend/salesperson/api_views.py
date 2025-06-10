"""
API Views for the Stock Management System
"""
import logging
from django.db import transaction
from django.http import HttpResponse
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Product, Sale, Payment, SaleItem, PDFAccessToken
from .serializers import (
    UserSerializer, LoginSerializer, ProductSerializer, 
    SaleSerializer, PaymentSerializer, SalesReportSerializer,
    InventoryReportSerializer
)
from .permissions import IsAdminUser, IsAdminOrReadOnly, IsOwnerOrAdmin, CanCreateProductButNotDelete
from .pdf_utils import generate_sale_receipt_pdf

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token view that returns user data along with tokens"""
    
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role,
                'is_active': user.is_active
            }
        })


class UserListCreateView(generics.ListCreateAPIView):
    """List all users or create a new user (Admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter users based on role if specified"""
        queryset = User.objects.filter(is_active=True)  # Only return active users
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset.order_by('-date_joined')


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user (Admin only)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def update(self, request, *args, **kwargs):
        """Override update method to add debug logging"""
        logger.debug(f"Update request data: {request.data}")
        user = self.get_object()
        logger.debug(f"Current user data: email={user.email}, username={user.username}, first_name={user.first_name}, last_name={user.last_name}")
        
        partial = kwargs.pop('partial', False)
        serializer = self.get_serializer(user, data=request.data, partial=partial)
        
        if not serializer.is_valid():
            logger.error(f"Serializer validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_update(serializer)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete by deactivating user instead of hard delete"""
        user = self.get_object()
        if not user.is_active:
            return Response(
                {"detail": "User is already deactivated"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = False
        user.save()
        return Response(
            {"detail": "User deactivated successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """Get or update current user's profile"""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ProductListCreateView(generics.ListCreateAPIView):
    """List all products or create a new product"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [CanCreateProductButNotDelete]
    
    def get_queryset(self):
        """Filter products based on query parameters"""
        queryset = Product.objects.all()
        
        # Filter by active status
        active_only = self.request.query_params.get('active_only', 'true').lower() == 'true'
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__icontains=category)
        
        # Filter by stock status
        stock_status = self.request.query_params.get('stock_status', None)
        if stock_status == 'out_of_stock':
            queryset = queryset.filter(stock_quantity=0)
        elif stock_status == 'low_stock':
            queryset = queryset.filter(stock_quantity__gt=0, stock_quantity__lte=10)
        elif stock_status == 'in_stock':
            queryset = queryset.filter(stock_quantity__gt=10)
        
        # Search by name or SKU
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(sku__icontains=search)
            )
        
        return queryset.order_by('name')


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a product"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [CanCreateProductButNotDelete]
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete by deactivating product instead of hard delete"""
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SaleListCreateView(generics.ListCreateAPIView):
    """List all sales or create a new sale"""
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter sales based on user role and query parameters"""
        user = self.request.user
        queryset = Sale.objects.all()
        
        # Salespersons can only see their own sales
        if user.role == 'Salesperson':
            queryset = queryset.filter(salesperson=user)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Filter by payment status
        payment_status = self.request.query_params.get('payment_status', None)
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
        
        # Filter by salesperson (Admin only)
        if user.role == 'Admin':
            salesperson_id = self.request.query_params.get('salesperson', None)
            if salesperson_id:
                queryset = queryset.filter(salesperson_id=salesperson_id)
        
        return queryset.select_related('salesperson').prefetch_related('items__product').order_by('-created_at')
    
    @transaction.atomic
    def perform_create(self, serializer):
        """Create sale with proper stock management"""
        serializer.save()


class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a sale"""
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer
    permission_classes = [IsOwnerOrAdmin]
    
    def get_queryset(self):
        """Filter sales based on user role"""
        user = self.request.user
        queryset = Sale.objects.select_related('salesperson').prefetch_related('items__product')
        
        if user.role == 'Salesperson':
            queryset = queryset.filter(salesperson=user)
        
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        """Delete a sale (Admin only)"""
        # Only admins can delete sales
        if request.user.role != 'Admin':
            return Response(
                {'error': 'Only administrators can delete sales'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        sale = self.get_object()
        
        # Restore stock quantities when deleting a sale
        with transaction.atomic():
            for item in sale.items.all():
                product = item.product
                product.stock_quantity += item.quantity
                product.save()
                logger.info(f"Restored {item.quantity} units to product {product.name}")
            
            # Delete the sale
            sale.delete()
            logger.info(f"Sale {sale.id} deleted by admin {request.user.email}")
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def update(self, request, *args, **kwargs):
        """Update a sale (Admin only)"""
        # Only admins can update sales
        if request.user.role != 'Admin':
            return Response(
                {'error': 'Only administrators can update sales'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)


class SaleReceiptView(APIView):
    """Generate and download PDF receipt for a sale"""
    permission_classes = [IsOwnerOrAdmin]
    
    def get(self, request, pk):
        """Generate and return PDF receipt for a sale"""
        try:
            # Get the sale
            user = request.user
            if user.role == 'Salesperson':
                sale = Sale.objects.select_related('salesperson').prefetch_related('items__product').get(
                    pk=pk, salesperson=user
                )
            else:
                sale = Sale.objects.select_related('salesperson').prefetch_related('items__product').get(pk=pk)
            
            # Prepare sale data for PDF generation
            sale_data = {
                'id': sale.id,
                'created_at': sale.created_at.isoformat(),
                'salesperson_name': sale.salesperson.full_name,
                'payment_method': sale.payment_method,
                'payment_status': sale.payment_status,
                'total_amount': float(sale.total_amount),
                'amount_paid': float(sale.amount_paid),
                'balance': float(sale.balance),
                'products_sold': []
            }
            
            # Add products to sale data
            for item in sale.items.all():
                sale_data['products_sold'].append({
                    'name': item.product.name,
                    'quantity': item.quantity,
                    'price_at_sale': float(item.price_at_sale)
                })
            
            # Generate PDF receipt
            from .pdf_generator import generate_sale_receipt
            pdf_data = generate_sale_receipt(sale_data)
            
            # Create HTTP response with PDF
            response = HttpResponse(pdf_data, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="receipt_{sale.id}.pdf"'
            response['Content-Length'] = len(pdf_data)
            
            logger.info(f"PDF receipt generated for sale {sale.id} by user {request.user.email}")
            return response
            
        except Sale.DoesNotExist:
            return Response(
                {'error': 'Sale not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error generating PDF receipt for sale {pk}: {str(e)}")
            return Response(
                {'error': 'Failed to generate receipt'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentListCreateView(generics.ListCreateAPIView):
    """List all payments or create a new payment"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments based on query parameters and user role"""
        user = self.request.user
        queryset = Payment.objects.select_related('sale', 'recorded_by', 'sale__salesperson')
        
        # Role-based filtering: Salespersons can only see payments for their own sales
        if user.role == 'Salesperson':
            queryset = queryset.filter(sale__salesperson=user)
        
        # Filter by sale
        sale_id = self.request.query_params.get('sale', None)
        if sale_id:
            queryset = queryset.filter(sale_id=sale_id)
        
        # Filter by customer name
        customer_name = self.request.query_params.get('customer_name', None)
        if customer_name:
            queryset = queryset.filter(sale__customer_name__icontains=customer_name)
        
        # Filter by customer phone
        customer_phone = self.request.query_params.get('customer_phone', None)
        if customer_phone:
            queryset = queryset.filter(sale__customer_phone__icontains=customer_phone)
        
        # Filter by payment status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by payment method
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filter by sale payment status (debt/credit status)
        sale_payment_status = self.request.query_params.get('sale_payment_status', None)
        if sale_payment_status:
            queryset = queryset.filter(sale__payment_status=sale_payment_status)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Filter by time range (for more specific filtering)
        time_from = self.request.query_params.get('time_from', None)
        time_to = self.request.query_params.get('time_to', None)
        
        if time_from:
            try:
                time_from = datetime.strptime(time_from, '%H:%M').time()
                queryset = queryset.filter(created_at__time__gte=time_from)
            except ValueError:
                pass
        
        if time_to:
            try:
                time_to = datetime.strptime(time_to, '%H:%M').time()
                queryset = queryset.filter(created_at__time__lte=time_to)
            except ValueError:
                pass
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Ensure only admins can create payments"""
        if self.request.user.role != 'Admin':
            raise PermissionDenied("Only administrators can record payments.")
        serializer.save()


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a payment"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        queryset = Payment.objects.select_related('sale', 'recorded_by', 'sale__salesperson')
        
        # Role-based filtering: Salespersons can only see payments for their own sales
        if user.role == 'Salesperson':
            queryset = queryset.filter(sale__salesperson=user)
        
        return queryset
    
    def perform_update(self, serializer):
        """Ensure only admins can update payments"""
        if self.request.user.role != 'Admin':
            raise PermissionDenied("Only administrators can update payments.")
        serializer.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_summary(request):
    """Get payment summary statistics"""
    user = request.user
    
    # Base queryset based on user role
    if user.role == 'Admin':
        payments_queryset = Payment.objects.all()
        sales_queryset = Sale.objects.all()
    else:
        payments_queryset = Payment.objects.filter(sale__salesperson=user)
        sales_queryset = Sale.objects.filter(salesperson=user)
    
    # Apply date filters if provided
    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            payments_queryset = payments_queryset.filter(created_at__date__gte=date_from)
            sales_queryset = sales_queryset.filter(created_at__date__gte=date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            payments_queryset = payments_queryset.filter(created_at__date__lte=date_to)
            sales_queryset = sales_queryset.filter(created_at__date__lte=date_to)
        except ValueError:
            pass
    
    # Calculate statistics
    # Total payments - sum of all completed payments + amount paid from sales
    payment_records_total = payments_queryset.filter(status='Completed').aggregate(total=Sum('amount'))['total'] or 0
    sales_amount_paid_total = sales_queryset.aggregate(total=Sum('amount_paid'))['total'] or 0
    total_payments = payment_records_total + sales_amount_paid_total
    
    # Total credits and partial debts
    total_credits = sales_queryset.filter(payment_status='unpaid').aggregate(total=Sum('balance'))['total'] or 0
    total_partial_debts = sales_queryset.filter(payment_status='partial').aggregate(total=Sum('balance'))['total'] or 0
    
    # Count statistics
    completed_payments = payments_queryset.filter(status='Completed').count()
    pending_payments = payments_queryset.filter(status='Pending').count()
    
    # Credit sales count should include all sales made on credit, regardless of payment status
    credit_sales_count = sales_queryset.filter(payment_method='Credit').count()
    partial_payments_count = sales_queryset.filter(payment_status='partial').count()
    
    # Calculate total credits over 1000
    credits_over_1000 = sales_queryset.filter(
        payment_status='unpaid', 
        balance__gte=1000
    ).aggregate(total=Sum('balance'))['total'] or 0
    
    # Debug logging
    print(f"Debug - User: {user.email}, Role: {user.role}")
    print(f"Debug - Sales count: {sales_queryset.count()}")
    print(f"Debug - Payments count: {payments_queryset.count()}")
    print(f"Debug - Total payments: {total_payments}")
    print(f"Debug - Credit sales count: {credit_sales_count}")
    print(f"Debug - Total partial debts: {total_partial_debts}")
    print(f"Debug - Credits over 1000: {credits_over_1000}")
    
    # Top customers with debt
    customers_with_debt = sales_queryset.filter(
        payment_status__in=['unpaid', 'partial'],
        customer_name__isnull=False
    ).exclude(customer_name='').values(
        'customer_name', 'customer_phone'
    ).annotate(
        total_debt=Sum('balance'),
        sales_count=Count('id')
    ).order_by('-total_debt')[:10]
    
    # Recent payments
    recent_payments = payments_queryset.select_related(
        'sale', 'recorded_by'
    ).order_by('-created_at')[:5]
    
    recent_payments_data = [
        {
            'id': payment.id,
            'amount': payment.amount,
            'customer_name': payment.sale.customer_name,
            'payment_method': payment.payment_method,
            'created_at': payment.created_at,
            'recorded_by': payment.recorded_by.full_name
        } for payment in recent_payments
    ]
    
    return Response({
        'total_payments': total_payments,
        'total_credits': total_credits,
        'total_partial_debts': total_partial_debts,
        'credits_over_1000': credits_over_1000,
        'completed_payments_count': completed_payments,
        'pending_payments_count': pending_payments,
        'credit_sales_count': credit_sales_count,
        'partial_payments_count': partial_payments_count,
        'customers_with_debt': list(customers_with_debt),
        'recent_payments': recent_payments_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sales_report(request):
    """Generate sales report"""
    user = request.user
    
    # Get query parameters
    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    salesperson_id = request.GET.get('salesperson', None)
    payment_status = request.GET.get('payment_status', None)
    
    # Base queryset
    queryset = Sale.objects.all()
    
    # Role-based filtering
    if user.role == 'Salesperson':
        queryset = queryset.filter(salesperson=user)
    elif salesperson_id and user.role == 'Admin':
        queryset = queryset.filter(salesperson_id=salesperson_id)
    
    # Date filtering
    if date_from:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__gte=date_from)
        except ValueError:
            pass
    
    if date_to:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
            queryset = queryset.filter(created_at__date__lte=date_to)
        except ValueError:
            pass
    
    # Payment status filtering
    if payment_status:
        queryset = queryset.filter(payment_status=payment_status)
    
    # Calculate summary statistics
    summary = queryset.aggregate(
        total_sales=Count('id'),
        total_revenue=Sum('total_amount'),
        total_paid=Sum('amount_paid'),
        total_balance=Sum('balance')
    )
    
    # Payment method breakdown
    payment_methods = queryset.values('payment_method').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('payment_method')
    
    # Payment status breakdown
    payment_status_breakdown = queryset.values('payment_status').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('payment_status')
    
    # Top products (if Admin or specific date range)
    top_products = []
    if user.role == 'Admin' or (date_from and date_to):
        sale_items = SaleItem.objects.filter(sale__in=queryset).values(
            'product__name', 'product__sku'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('subtotal')
        ).order_by('-total_quantity')[:10]
        top_products = list(sale_items)
    
    return Response({
        'summary': summary,
        'payment_methods': list(payment_methods),
        'payment_status': list(payment_status_breakdown),
        'top_products': top_products,
        'period': {
            'from': date_from,
            'to': date_to
        }
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def inventory_report(request):
    """Generate inventory report (Admin only)"""
    # Get query parameters
    category = request.GET.get('category', None)
    stock_status = request.GET.get('stock_status', None)
    active_only = request.GET.get('active_only', 'true').lower() == 'true'
    
    # Base queryset
    queryset = Product.objects.all()
    
    # Apply filters
    if active_only:
        queryset = queryset.filter(is_active=True)
    
    if category:
        queryset = queryset.filter(category__icontains=category)
    
    if stock_status == 'out_of_stock':
        queryset = queryset.filter(stock_quantity=0)
    elif stock_status == 'low_stock':
        queryset = queryset.filter(stock_quantity__gt=0, stock_quantity__lte=10)
    elif stock_status == 'in_stock':
        queryset = queryset.filter(stock_quantity__gt=10)
    
    # Calculate summary statistics
    summary = queryset.aggregate(
        total_products=Count('id'),
        total_stock_value=Sum('stock_quantity') * Sum('price') / Count('id') if queryset.exists() else 0,
        out_of_stock=Count('id', filter=Q(stock_quantity=0)),
        low_stock=Count('id', filter=Q(stock_quantity__gt=0, stock_quantity__lte=10)),
        in_stock=Count('id', filter=Q(stock_quantity__gt=10))
    )
    
    # Category breakdown
    categories = queryset.values('category').annotate(
        count=Count('id'),
        total_stock=Sum('stock_quantity')
    ).order_by('category')
    
    # Low stock items
    low_stock_items = queryset.filter(
        stock_quantity__gt=0, 
        stock_quantity__lte=10
    ).values('id', 'name', 'sku', 'stock_quantity', 'price')
    
    # Out of stock items
    out_of_stock_items = queryset.filter(
        stock_quantity=0
    ).values('id', 'name', 'sku', 'price')
    
    return Response({
        'summary': summary,
        'categories': list(categories),
        'low_stock_items': list(low_stock_items),
        'out_of_stock_items': list(out_of_stock_items),
        'filters_applied': {
            'category': category,
            'stock_status': stock_status,
            'active_only': active_only
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics for the user"""
    user = request.user
    today = timezone.now().date()
    this_month_start = today.replace(day=1)
    
    if user.role == 'Admin':
        # Admin can see all stats
        sales_queryset = Sale.objects.all()
        products_queryset = Product.objects.filter(is_active=True)
        users_queryset = User.objects.filter(role='Salesperson', is_active=True)
        
        stats = {
            'total_sales_today': sales_queryset.filter(created_at__date=today).count(),
            'total_revenue_today': sales_queryset.filter(
                created_at__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'total_sales_this_month': sales_queryset.filter(
                created_at__date__gte=this_month_start
            ).count(),
            'total_revenue_this_month': sales_queryset.filter(
                created_at__date__gte=this_month_start
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'total_products': products_queryset.count(),
            'low_stock_products': products_queryset.filter(
                stock_quantity__gt=0, stock_quantity__lte=10
            ).count(),
            'out_of_stock_products': products_queryset.filter(stock_quantity=0).count(),
            'total_salespersons': users_queryset.count(),
            'pending_payments': Sale.objects.filter(
                payment_status__in=['partial', 'unpaid']
            ).aggregate(total=Sum('balance'))['total'] or 0
        }
    else:
        # Salesperson can only see their own stats
        sales_queryset = Sale.objects.filter(salesperson=user)
        
        stats = {
            'my_sales_today': sales_queryset.filter(created_at__date=today).count(),
            'my_revenue_today': sales_queryset.filter(
                created_at__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'my_sales_this_month': sales_queryset.filter(
                created_at__date__gte=this_month_start
            ).count(),
            'my_revenue_this_month': sales_queryset.filter(
                created_at__date__gte=this_month_start
            ).aggregate(total=Sum('total_amount'))['total'] or 0,
            'my_pending_sales': sales_queryset.filter(
                payment_status__in=['partial', 'unpaid']
            ).count(),
            'my_pending_amount': sales_queryset.filter(
                payment_status__in=['partial', 'unpaid']
            ).aggregate(total=Sum('balance'))['total'] or 0
        }
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_receipt_pdf(request, sale_id):
    """
    Generate PDF receipt for a sale
    Only allows users to generate receipts for sales they can view
    """
    try:
        # Check if sale exists and user has permission to view it
        sale = Sale.objects.get(id=sale_id)
        
        # Permission check: Admin can view all, Salesperson can view only their own
        if request.user.role != 'Admin' and sale.salesperson != request.user:
            return Response(
                {'error': 'You do not have permission to generate receipt for this sale'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate and return PDF
        pdf_response = generate_sale_receipt_pdf(sale_id)
        return pdf_response
        
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Sale not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error generating PDF receipt for sale {sale_id}: {str(e)}")
        return Response(
            {'error': 'Failed to generate receipt'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_pdf_token(request, sale_id):
    """
    Create a secure token for unauthenticated PDF access
    Returns a token that can be used to download the PDF without authentication
    """
    try:
        # Check if sale exists and user has permission to view it
        sale = Sale.objects.get(id=sale_id)
        
        # Permission check: Admin can view all, Salesperson can view only their own
        if request.user.role != 'Admin' and sale.salesperson != request.user:
            return Response(
                {'error': 'You do not have permission to generate receipt for this sale'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create a new PDF access token
        pdf_token = PDFAccessToken.objects.create(sale=sale)
        
        return Response({
            'token': str(pdf_token.token),
            'expires_at': pdf_token.expires_at.isoformat(),
            'download_url': f'/api/sales/{sale_id}/pdf/{pdf_token.token}/'
        }, status=status.HTTP_201_CREATED)
        
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Sale not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error creating PDF token for sale {sale_id}: {str(e)}")
        return Response(
            {'error': 'Failed to create PDF token'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # No authentication required
def download_pdf_with_token(request, sale_id, token):
    """
    Download PDF using a secure token (no authentication required)
    """
    try:
        # Find the token
        pdf_token = PDFAccessToken.objects.get(token=token, sale_id=sale_id)
        
        # Check if token is valid
        if not pdf_token.is_valid():
            return Response(
                {'error': 'Token has expired or is invalid'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Mark token as used (optional - you might want to allow multiple downloads)
        # pdf_token.is_used = True
        # pdf_token.save()
        
        # Generate and return PDF
        pdf_response = generate_sale_receipt_pdf(sale_id)
        return pdf_response
        
    except PDFAccessToken.DoesNotExist:
        return Response(
            {'error': 'Invalid token'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error downloading PDF with token for sale {sale_id}: {str(e)}")
        return Response(
            {'error': 'Failed to download receipt'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def comprehensive_reports(request):
    """Generate comprehensive reports with chart data"""
    user = request.user
    today = timezone.now().date()
    
    # Get query parameters
    date_from = request.GET.get('date_from', None)
    date_to = request.GET.get('date_to', None)
    
    # Default to last 30 days if no dates provided
    if not date_from:
        date_from = today - timedelta(days=30)
    else:
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            date_from = today - timedelta(days=30)
    
    if not date_to:
        date_to = today
    else:
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            date_to = today
    
    # Base querysets
    sales_queryset = Sale.objects.filter(created_at__date__gte=date_from, created_at__date__lte=date_to)
    products_queryset = Product.objects.filter(is_active=True)
    payments_queryset = Payment.objects.filter(created_at__date__gte=date_from, created_at__date__lte=date_to)
    
    # Role-based filtering
    if user.role == 'Salesperson':
        sales_queryset = sales_queryset.filter(salesperson=user)
        payments_queryset = payments_queryset.filter(sale__salesperson=user)
    
    # Chart Data - Daily Sales for the period
    chart_data = []
    current_date = date_from
    while current_date <= date_to:
        daily_sales = sales_queryset.filter(created_at__date=current_date).aggregate(
            total_amount=Sum('total_amount'),
            count=Count('id')
        )
        chart_data.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'sales_amount': float(daily_sales['total_amount'] or 0),
            'sales_count': daily_sales['count']
        })
        current_date += timedelta(days=1)
    
    # Sales Summary
    sales_summary = sales_queryset.aggregate(
        total_sales=Count('id'),
        total_revenue=Sum('total_amount'),
        total_paid=Sum('amount_paid'),
        total_balance=Sum('balance')
    )
    
    # Payment Status Breakdown
    payment_status_breakdown = sales_queryset.values('payment_status').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    ).order_by('payment_status')
    
    # Top Products
    top_products = SaleItem.objects.filter(sale__in=sales_queryset).values(
        'product__name', 'product__sku', 'product__price'
    ).annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum('subtotal')
    ).order_by('-total_quantity')[:10]
    
    # Inventory Status (Admin only)
    inventory_status = {}
    if user.role == 'Admin':
        inventory_status = {
            'total_products': products_queryset.count(),
            'out_of_stock': products_queryset.filter(stock_quantity=0).count(),
            'low_stock': products_queryset.filter(stock_quantity__gt=0, stock_quantity__lte=10).count(),
            'in_stock': products_queryset.filter(stock_quantity__gt=10).count(),
            'low_stock_items': list(products_queryset.filter(
                stock_quantity__gt=0, stock_quantity__lte=10
            ).values('id', 'name', 'sku', 'stock_quantity', 'price')[:10]),
            'out_of_stock_items': list(products_queryset.filter(
                stock_quantity=0
            ).values('id', 'name', 'sku', 'price')[:10])
        }
    
    # Credit/Debt Summary
    credit_summary = {
        'total_unpaid_sales': sales_queryset.filter(payment_status='unpaid').count(),
        'total_partial_sales': sales_queryset.filter(payment_status='partial').count(),
        'total_outstanding_balance': sales_queryset.filter(
            payment_status__in=['unpaid', 'partial']
        ).aggregate(total=Sum('balance'))['total'] or 0,
        'unpaid_sales': list(sales_queryset.filter(
            payment_status='unpaid'
        ).values(
            'id', 'customer_name', 'customer_phone', 'total_amount', 'balance', 'created_at'
        )[:10]),
        'partial_sales': list(sales_queryset.filter(
            payment_status='partial'
        ).values(
            'id', 'customer_name', 'customer_phone', 'total_amount', 'amount_paid', 'balance', 'created_at'
        )[:10])
    }
    
    # Payment Summary
    payment_summary = payments_queryset.aggregate(
        total_payments=Count('id'),
        total_amount=Sum('amount')
    )
    
    # Recent Activity
    recent_sales = list(sales_queryset.order_by('-created_at')[:5].values(
        'id', 'customer_name', 'total_amount', 'payment_status', 'created_at'
    ))
    
    recent_payments = list(payments_queryset.order_by('-created_at')[:5].values(
        'id', 'sale__customer_name', 'amount', 'payment_method', 'created_at'
    ))
    
    return Response({
        'chart_data': chart_data,
        'sales_summary': sales_summary,
        'payment_status_breakdown': list(payment_status_breakdown),
        'top_products': list(top_products),
        'inventory_status': inventory_status,
        'credit_summary': credit_summary,
        'payment_summary': payment_summary,
        'recent_activity': {
            'sales': recent_sales,
            'payments': recent_payments
        },
        'period': {
            'from': date_from.strftime('%Y-%m-%d'),
            'to': date_to.strftime('%Y-%m-%d')
        }
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def update_sale_payment_status(request, pk):
    """
    Update the payment status of a sale to 'paid' (Salesperson can update own sales, Admin can update any)
    """
    try:
        # Get the sale
        user = request.user
        if user.role == 'Salesperson':
            sale = Sale.objects.get(pk=pk, salesperson=user)
        else:  # Admin
            sale = Sale.objects.get(pk=pk)
        
        # Get the new payment status from request
        new_status = request.data.get('payment_status', '').lower()
        
        # Only allow updating to 'paid' status for this endpoint
        if new_status != 'paid':
            return Response(
                {'error': 'This endpoint only allows updating payment status to "paid"'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Only allow updating if current status is 'partial' or 'unpaid'
        current_status = sale.payment_status.lower() if sale.payment_status else ''
        if current_status not in ['partial', 'unpaid']:
            return Response(
                {'error': f'Cannot update payment status from "{sale.payment_status}" to "paid". Only "partial" and "unpaid" sales can be marked as paid.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the sale
        old_status = sale.payment_status
        sale.payment_status = 'paid'
        sale.amount_paid = sale.total_amount  # Mark as fully paid
        sale.balance = 0  # Clear any balance
        sale.save()
        
        logger.info(f"Sale {sale.id} payment status updated from '{old_status}' to 'paid' by {user.email}")
        
        # Return updated sale data
        serializer = SaleSerializer(sale)
        return Response({
            'message': 'Payment status updated successfully',
            'sale': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Sale not found or you do not have permission to update it'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error updating sale payment status: {str(e)}")
        return Response(
            {'error': 'An error occurred while updating the payment status'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
