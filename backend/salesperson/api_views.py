"""
API Views for the Stock Management System
"""
import logging
from django.db import transaction
from django.db.models import Q, Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import User, Product, Sale, Payment, SaleItem
from .serializers import (
    UserSerializer, LoginSerializer, ProductSerializer, 
    SaleSerializer, PaymentSerializer, SalesReportSerializer,
    InventoryReportSerializer
)
from .permissions import IsAdminUser, IsAdminOrReadOnly, IsOwnerOrAdmin

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
    permission_classes = [IsAdminOrReadOnly]
    
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
    permission_classes = [IsAdminOrReadOnly]
    
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


class SaleDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a sale"""
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


class PaymentListCreateView(generics.ListCreateAPIView):
    """List all payments or create a new payment (Admin only)"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Filter payments based on query parameters"""
        queryset = Payment.objects.select_related('sale', 'recorded_by')
        
        # Filter by sale
        sale_id = self.request.query_params.get('sale', None)
        if sale_id:
            queryset = queryset.filter(sale_id=sale_id)
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
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
        
        return queryset.order_by('-created_at')


class PaymentDetailView(generics.RetrieveUpdateAPIView):
    """Retrieve or update a payment (Admin only)"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAdminUser]


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
