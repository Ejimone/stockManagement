"""
Serializers for the Stock Management System API
"""
import logging
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Product, Sale, Payment, SaleItem

logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'required': False},  # Make username optional since we'll set it automatically
            'date_joined': {'read_only': True}
        }
    
    def create(self, validated_data):
        """Create user with hashed password"""
        password = validated_data.pop('password')
        
        # Ensure username is set to email if not provided
        if 'username' not in validated_data or not validated_data['username']:
            validated_data['username'] = validated_data['email']
            
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        """Update user, handle password separately"""
        logger.debug(f"UserSerializer.update called with data: {validated_data}")
        logger.debug(f"Current instance: email={instance.email}, username={instance.username}")
        
        password = validated_data.pop('password', None)
        
        # Ensure username matches email if email is being updated
        if 'email' in validated_data:
            validated_data['username'] = validated_data['email']
            logger.debug(f"Setting username to: {validated_data['username']}")
        
        try:
            for attr, value in validated_data.items():
                logger.debug(f"Setting {attr} = {value}")
                setattr(instance, attr, value)
            
            if password:
                logger.debug("Setting new password")
                instance.set_password(password)
                
            instance.save()
            logger.debug("User updated successfully")
            return instance
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise


class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include email and password.')


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""
    stock_status = serializers.SerializerMethodField()
    price = serializers.FloatField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'sku', 'price', 'stock_quantity', 
            'category', 'is_active', 'stock_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_stock_status(self, obj):
        """Get stock status based on quantity"""
        if obj.stock_quantity <= 0:
            return 'out_of_stock'
        elif obj.stock_quantity <= 10:  # Low stock threshold
            return 'low_stock'
        else:
            return 'in_stock'
    
    def validate_stock_quantity(self, value):
        """Validate stock quantity"""
        if value < 0:
            raise serializers.ValidationError("Stock quantity cannot be negative.")
        return value
    
    def validate_price(self, value):
        """Validate price"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value


class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer for SaleItem model"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_sku', 
            'quantity', 'price_at_sale', 'subtotal'
        ]
        read_only_fields = ['subtotal']


class SaleSerializer(serializers.ModelSerializer):
    """Serializer for Sale model"""
    salesperson_name = serializers.CharField(source='salesperson.full_name', read_only=True)
    items = SaleItemSerializer(many=True, read_only=True)
    products_sold_data = serializers.ListField(write_only=True, required=False)
    
    class Meta:
        model = Sale
        fields = [
            'id', 'salesperson', 'salesperson_name', 'customer_name', 
            'customer_phone', 'products_sold', 'items', 'products_sold_data',
            'total_amount', 'payment_method', 'payment_status', 'amount_paid', 
            'balance', 'notes', 'created_at'
        ]
        read_only_fields = ['salesperson', 'total_amount', 'balance', 'created_at']
    
    def create(self, validated_data):
        """Create sale with sale items"""
        products_sold_data = validated_data.pop('products_sold_data', [])
        request = self.context.get('request')
        validated_data['salesperson'] = request.user
        
        # Create the sale
        sale = Sale.objects.create(**validated_data)
        
        # Create sale items and calculate total
        total_amount = 0
        sale_items = []
        
        for item_data in products_sold_data:
            product_id = item_data.get('product_id')
            quantity = item_data.get('quantity')
            
            try:
                product = Product.objects.get(id=product_id, is_active=True)
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Product with ID {product_id} not found.")
            
            # Check stock availability
            if product.stock_quantity < quantity:
                raise serializers.ValidationError(
                    f"Insufficient stock for {product.name}. Available: {product.stock_quantity}, Requested: {quantity}"
                )
            
            # Create sale item
            sale_item = SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                price_at_sale=product.price
            )
            sale_items.append(sale_item)
            total_amount += sale_item.subtotal
            
            # Update product stock
            product.stock_quantity -= quantity
            product.save()
        
        # Update sale total and save
        sale.total_amount = total_amount
        sale.save()
        
        return sale


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    recorded_by_name = serializers.CharField(source='recorded_by.full_name', read_only=True)
    sale_customer = serializers.CharField(source='sale.customer_name', read_only=True)
    sale_customer_phone = serializers.CharField(source='sale.customer_phone', read_only=True)
    sale_total_amount = serializers.DecimalField(source='sale.total_amount', max_digits=12, decimal_places=2, read_only=True)
    sale_balance = serializers.DecimalField(source='sale.balance', max_digits=12, decimal_places=2, read_only=True)
    sale_payment_status = serializers.CharField(source='sale.payment_status', read_only=True)
    sale_created_at = serializers.DateTimeField(source='sale.created_at', read_only=True)
    salesperson_name = serializers.CharField(source='sale.salesperson.full_name', read_only=True)
    sale_items_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'sale', 'sale_customer', 'sale_customer_phone', 'sale_total_amount', 
            'sale_balance', 'sale_payment_status', 'sale_created_at', 'salesperson_name',
            'sale_items_summary', 'amount', 'payment_method', 'reference_number', 
            'status', 'recorded_by', 'recorded_by_name', 'notes', 'created_at'
        ]
        read_only_fields = ['recorded_by', 'created_at']
    
    def get_sale_items_summary(self, obj):
        """Get a summary of items in the sale"""
        sale_items = obj.sale.items.all()
        return [
            {
                'product_name': item.product_name,
                'quantity': item.quantity,
                'price': item.price_at_sale,
                'subtotal': item.subtotal
            } for item in sale_items
        ]
    
    def create(self, validated_data):
        """Create payment with recorded_by set to current user"""
        request = self.context.get('request')
        validated_data['recorded_by'] = request.user
        return super().create(validated_data)
    
    def validate_amount(self, value):
        """Validate payment amount"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than zero.")
        return value
    
    def validate(self, attrs):
        """Validate payment against sale balance"""
        sale = attrs.get('sale')
        amount = attrs.get('amount')
        
        if sale and amount:
            if amount > sale.balance:
                raise serializers.ValidationError(
                    f"Payment amount ({amount}) cannot exceed sale balance ({sale.balance})."
                )
        
        return attrs


class SalesReportSerializer(serializers.Serializer):
    """Serializer for sales report data"""
    date_from = serializers.DateField(required=False)
    date_to = serializers.DateField(required=False)
    salesperson = serializers.IntegerField(required=False)
    payment_status = serializers.ChoiceField(
        choices=['paid', 'partial', 'unpaid'], 
        required=False
    )


class InventoryReportSerializer(serializers.Serializer):
    """Serializer for inventory report data"""
    category = serializers.CharField(required=False)
    stock_status = serializers.ChoiceField(
        choices=['in_stock', 'low_stock', 'out_of_stock'], 
        required=False
    )
    active_only = serializers.BooleanField(default=True)
