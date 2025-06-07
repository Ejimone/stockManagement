from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator
from decimal import Decimal


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        
        # Set username to email if not provided
        if 'username' not in extra_fields:
            extra_fields['username'] = email
            
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with an email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom user model extending Django's AbstractUser.
    Supports role-based access control for Admin and Salesperson roles.
    """
    ROLE_ADMIN = 'Admin'
    ROLE_SALESPERSON = 'Salesperson'
    ROLE_CHOICES = [
        (ROLE_ADMIN, 'Admin'),
        (ROLE_SALESPERSON, 'Salesperson'),
    ]
    
    # Additional fields beyond Django's default user fields
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default=ROLE_SALESPERSON,
        help_text=_('User role in the system')
    )
    
    # Override email to make it required and unique
    email = models.EmailField(_('email address'), unique=True)
    
    # Use email as the login field instead of username
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    # Use custom manager
    objects = UserManager()
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
    
    @property
    def full_name(self):
        """Return user's full name or username if names are empty."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}".strip()
        return self.username
    
    def is_admin(self):
        """Check if user has admin role."""
        return self.role == self.ROLE_ADMIN
    
    def is_salesperson(self):
        """Check if user has salesperson role."""
        return self.role == self.ROLE_SALESPERSON
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"

class Product(models.Model):
    """
    Product model representing items in the inventory.
    Tracks stock levels, pricing, and categorization.
    """
    name = models.CharField(max_length=255, help_text=_("Product name"))
    description = models.TextField(blank=True, null=True, help_text=_("Product description"))
    sku = models.CharField(
        max_length=100, 
        unique=True, 
        help_text=_("Stock Keeping Unit - unique identifier")
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_("Product price")
    )
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text=_("Current stock quantity")
    )
    category = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text=_("Product category")
    )
    # Soft delete functionality
    is_active = models.BooleanField(default=True, help_text=_("Is product active/available"))
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    @property
    def is_in_stock(self):
        """Check if product has stock available."""
        return self.stock_quantity > 0
    
    @property
    def is_low_stock(self, threshold=10):
        """Check if product stock is below threshold."""
        return self.stock_quantity <= threshold
    
    def reduce_stock(self, quantity):
        """Reduce stock quantity by specified amount."""
        if self.stock_quantity >= quantity:
            self.stock_quantity -= quantity
            self.save()
            return True
        return False
    
    def add_stock(self, quantity):
        """Add stock quantity."""
        self.stock_quantity += quantity
        self.save()
    
    def __str__(self):
        return f"{self.name} ({self.sku}) - Stock: {self.stock_quantity}"

class Sale(models.Model):
    """
    Sale model representing a transaction.
    Contains product details, payment information, and references to salesperson.
    """
    PAYMENT_METHOD_CASH = 'Cash'
    PAYMENT_METHOD_CREDIT = 'Credit'
    PAYMENT_METHOD_MOBILE_MONEY = 'Mobile Money'
    PAYMENT_METHOD_BANK_TRANSFER = 'Bank Transfer'
    PAYMENT_METHOD_CHOICES = [
        (PAYMENT_METHOD_CASH, 'Cash'),
        (PAYMENT_METHOD_CREDIT, 'Credit'),
        (PAYMENT_METHOD_MOBILE_MONEY, 'Mobile Money'),
        (PAYMENT_METHOD_BANK_TRANSFER, 'Bank Transfer'),
    ]

    PAYMENT_STATUS_PAID = 'Paid'
    PAYMENT_STATUS_PARTIAL = 'Partial'
    PAYMENT_STATUS_UNPAID = 'Unpaid'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PAID, 'Paid'),
        (PAYMENT_STATUS_PARTIAL, 'Partial'),
        (PAYMENT_STATUS_UNPAID, 'Unpaid'),
    ]

    # Sale identification and relationships
    salesperson = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='sales_made',
        help_text=_("Salesperson who made this sale")
    )
    salesperson_name = models.CharField(
        max_length=255, 
        help_text=_("Snapshot of salesperson's name at time of sale")
    )
    
    # Customer information (optional)
    customer_name = models.CharField(
        max_length=255, 
        blank=True, 
        null=True,
        help_text=_("Customer name (optional)")
    )
    customer_phone = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text=_("Customer phone number (optional)")
    )
    
    # Products sold - JSON field storing array of product details
    # Structure: [{"product_id": int, "name": str, "quantity": int, "price_at_sale": decimal, "subtotal": decimal}]
    products_sold = models.JSONField(
        default=list,
        help_text=_("Array of products sold with quantities and prices")
    )
    
    # Financial details
    total_amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_("Total sale amount")
    )
    payment_method = models.CharField(
        max_length=50, 
        choices=PAYMENT_METHOD_CHOICES,
        help_text=_("Primary payment method used")
    )
    payment_status = models.CharField(
        max_length=50, 
        choices=PAYMENT_STATUS_CHOICES, 
        default=PAYMENT_STATUS_UNPAID,
        help_text=_("Current payment status")
    )
    amount_paid = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text=_("Amount already paid")
    )
    balance = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text=_("Remaining balance (calculated automatically)")
    )
    
    # Additional details
    credit_details = models.TextField(
        blank=True, 
        null=True, 
        help_text=_("Additional details for credit sales")
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text=_("Additional notes about the sale")
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['salesperson', '-created_at']),
            models.Index(fields=['payment_status']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['-created_at']),
        ]
    
    @property
    def is_fully_paid(self):
        """Check if sale is fully paid."""
        return self.payment_status == self.PAYMENT_STATUS_PAID
    
    @property
    def remaining_balance(self):
        """Calculate remaining balance."""
        if self.total_amount is None:
            return Decimal('0.00')
        return self.total_amount - self.amount_paid
    
    def update_payment_status(self):
        """Update payment status based on amount paid."""
        # Skip payment status update if total_amount is not set yet
        if self.total_amount is None:
            return
            
        remaining = self.remaining_balance
        if remaining <= 0:
            self.payment_status = self.PAYMENT_STATUS_PAID
            self.balance = Decimal('0.00')
        elif remaining < self.total_amount:
            self.payment_status = self.PAYMENT_STATUS_PARTIAL
            self.balance = remaining
        else:
            self.payment_status = self.PAYMENT_STATUS_UNPAID
            self.balance = remaining
    
    def save(self, *args, **kwargs):
        """Override save to auto-calculate balance and update payment status."""
        # Set salesperson name if not provided
        if not self.salesperson_name and self.salesperson:
            self.salesperson_name = self.salesperson.full_name
        
        # Update payment status and balance
        self.update_payment_status()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Sale #{self.id} - {self.salesperson_name} - ₦{self.total_amount} ({self.created_at.strftime('%Y-%m-%d')})"

class Payment(models.Model):
    """
    Payment model for tracking individual payments against sales.
    Particularly useful for credit sales with multiple payment installments.
    """
    PAYMENT_STATUS_PENDING = 'Pending'
    PAYMENT_STATUS_COMPLETED = 'Completed'
    PAYMENT_STATUS_FAILED = 'Failed'
    PAYMENT_STATUS_REFUNDED = 'Refunded'
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, 'Pending'),
        (PAYMENT_STATUS_COMPLETED, 'Completed'),
        (PAYMENT_STATUS_FAILED, 'Failed'),
        (PAYMENT_STATUS_REFUNDED, 'Refunded'),
    ]
    
    # Relationships
    sale = models.ForeignKey(
        Sale, 
        related_name='payments', 
        on_delete=models.CASCADE,
        help_text=_("Sale this payment belongs to")
    )
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='payments_recorded',
        limit_choices_to={'role': User.ROLE_ADMIN},
        help_text=_("Admin who recorded this payment")
    )
    
    # Payment details
    amount = models.DecimalField(
        max_digits=12, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_("Payment amount")
    )
    payment_method = models.CharField(
        max_length=50, 
        choices=Sale.PAYMENT_METHOD_CHOICES,
        help_text=_("Payment method used for this specific payment")
    )
    status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_COMPLETED,
        help_text=_("Payment status")
    )
    
    # Additional details
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text=_("Payment reference number (e.g., transaction ID)")
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text=_("Additional notes about this payment")
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sale', '-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
        ]
    
    def save(self, *args, **kwargs):
        """Override save to update the related sale's payment information."""
        is_new = self.pk is None
        super().save(*args, **kwargs)
        
        # Update the sale's total amount paid and payment status
        if self.status == self.PAYMENT_STATUS_COMPLETED and is_new:
            # Add this payment to the existing amount_paid
            self.sale.amount_paid += self.amount
            self.sale.save()
    
    def __str__(self):
        return f"Payment #{self.id} - ₦{self.amount} for Sale #{self.sale.id} ({self.status})"


class SaleItem(models.Model):
    """
    Individual items within a sale.
    Alternative to storing products_sold as JSON in Sale model.
    Use this if you prefer normalized database design.
    """
    sale = models.ForeignKey(
        Sale,
        related_name='items',
        on_delete=models.CASCADE,
        help_text=_("Sale this item belongs to")
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        help_text=_("Product being sold")
    )
    
    # Snapshot data at time of sale
    product_name = models.CharField(
        max_length=255,
        help_text=_("Product name at time of sale")
    )
    product_sku = models.CharField(
        max_length=100,
        help_text=_("Product SKU at time of sale")
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text=_("Quantity sold")
    )
    price_at_sale = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text=_("Price per unit at time of sale")
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text=_("Subtotal for this item (quantity × price)")
    )
    
    class Meta:
        unique_together = ['sale', 'product']
        indexes = [
            models.Index(fields=['sale']),
            models.Index(fields=['product']),
        ]
    
    def save(self, *args, **kwargs):
        """Override save to calculate subtotal and update product snapshot data."""
        if not self.product_name:
            self.product_name = self.product.name
        if not self.product_sku:
            self.product_sku = self.product.sku
        
        # Calculate subtotal
        self.subtotal = self.quantity * self.price_at_sale
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name} @ ₦{self.price_at_sale}"
