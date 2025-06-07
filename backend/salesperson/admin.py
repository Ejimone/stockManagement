from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Product, Sale, Payment, SaleItem


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom User Admin"""
    list_display = ('email', 'username', 'full_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'date_joined')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name')}),
        (_('Permissions'), {
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Product Admin"""
    list_display = ('name', 'sku', 'price', 'stock_quantity', 'category', 'is_active', 'created_at')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('name', 'sku', 'description')
    list_editable = ('price', 'stock_quantity', 'is_active')
    ordering = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'sku')
        }),
        (_('Pricing & Inventory'), {
            'fields': ('price', 'stock_quantity', 'category')
        }),
        (_('Status'), {
            'fields': ('is_active',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class SaleItemInline(admin.TabularInline):
    """Inline admin for Sale Items"""
    model = SaleItem
    extra = 0
    readonly_fields = ('subtotal',)


class PaymentInline(admin.TabularInline):
    """Inline admin for Payments"""
    model = Payment
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """Sale Admin"""
    list_display = ('id', 'salesperson_name', 'customer_name', 'total_amount', 'payment_status', 'payment_method', 'created_at')
    list_filter = ('payment_status', 'payment_method', 'created_at', 'salesperson')
    search_fields = ('salesperson_name', 'customer_name', 'customer_phone')
    ordering = ('-created_at',)
    readonly_fields = ('balance', 'created_at', 'updated_at')
    inlines = [SaleItemInline, PaymentInline]
    
    fieldsets = (
        (_('Sale Information'), {
            'fields': ('salesperson', 'salesperson_name')
        }),
        (_('Customer Information'), {
            'fields': ('customer_name', 'customer_phone')
        }),
        (_('Financial Details'), {
            'fields': ('total_amount', 'amount_paid', 'balance', 'payment_method', 'payment_status')
        }),
        (_('Additional Details'), {
            'fields': ('products_sold', 'credit_details', 'notes'),
            'classes': ('collapse',)
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Payment Admin"""
    list_display = ('id', 'sale', 'amount', 'payment_method', 'status', 'recorded_by', 'created_at')
    list_filter = ('status', 'payment_method', 'created_at')
    search_fields = ('sale__salesperson_name', 'reference_number')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Payment Information'), {
            'fields': ('sale', 'amount', 'payment_method', 'status')
        }),
        (_('Details'), {
            'fields': ('reference_number', 'notes', 'recorded_by')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    """Sale Item Admin"""
    list_display = ('sale', 'product_name', 'quantity', 'price_at_sale', 'subtotal')
    list_filter = ('sale__created_at',)
    search_fields = ('product_name', 'product_sku', 'sale__salesperson_name')
    ordering = ('-sale__created_at',)
    readonly_fields = ('subtotal',)
