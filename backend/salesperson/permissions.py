"""
Custom permissions for the Stock Management System
"""
from rest_framework import permissions


class IsAdminUser(permissions.BasePermission):
    """
    Custom permission to only allow Admin users to access a view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Admin'
        )


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to allow Admin users full access,
    and authenticated users read-only access.
    """
    
    def has_permission(self, request, view):
        # Read permissions for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Write permissions only for Admin users
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'Admin'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow Admin users full access,
    and Salespersons access to their own records only.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'Admin':
            return True
        
        # Salespersons can only access their own records
        if hasattr(obj, 'salesperson'):
            return obj.salesperson == request.user
        
        # For user objects, users can only access their own profile
        if hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False


class IsSalespersonOrAdmin(permissions.BasePermission):
    """
    Custom permission to allow both Admin and Salesperson users to access a view.
    """
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['Admin', 'Salesperson']
        )


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission to allow Admin users and object owners to access a view.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == 'Admin':
            return True
        
        # Check if the user is the owner of the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'salesperson'):
            return obj.salesperson == request.user
        elif hasattr(obj, 'id') and hasattr(request.user, 'id'):
            return obj.id == request.user.id
        
        return False
