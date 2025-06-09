"""
URL patterns for the Stock Management System API
"""
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import api_views

# API URL patterns
api_urlpatterns = [
    # Authentication endpoints
    path('auth/login/', api_views.CustomTokenObtainPairView.as_view(), name='api_login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='api_token_refresh'),
    path('auth/me/', api_views.CurrentUserView.as_view(), name='api_current_user'),
    
    # User management endpoints (Admin only)
    path('users/', api_views.UserListCreateView.as_view(), name='api_user_list'),
    path('users/<int:pk>/', api_views.UserDetailView.as_view(), name='api_user_detail'),
    
    # Product management endpoints
    path('products/', api_views.ProductListCreateView.as_view(), name='api_product_list'),
    path('products/<int:pk>/', api_views.ProductDetailView.as_view(), name='api_product_detail'),
    
    # Sales management endpoints
    path('sales/', api_views.SaleListCreateView.as_view(), name='api_sale_list'),
    path('sales/<int:pk>/', api_views.SaleDetailView.as_view(), name='api_sale_detail'),
    path('sales/<int:pk>/receipt/', api_views.SaleReceiptView.as_view(), name='api_sale_receipt'),
    path('sales/<int:sale_id>/pdf/', api_views.generate_receipt_pdf, name='api_sale_pdf'),
    
    # Payment management endpoints (Admin only)
    path('payments/', api_views.PaymentListCreateView.as_view(), name='api_payment_list'),
    path('payments/<int:pk>/', api_views.PaymentDetailView.as_view(), name='api_payment_detail'),
    
    # Dashboard and reporting endpoints
    path('dashboard/', api_views.dashboard_stats, name='api_dashboard'),
    path('reports/sales/', api_views.sales_report, name='api_sales_report'),
    path('reports/inventory/', api_views.inventory_report, name='api_inventory_report'),
]

urlpatterns = [
    # Include API patterns under /api/ prefix
    path('api/', include(api_urlpatterns)),
]
