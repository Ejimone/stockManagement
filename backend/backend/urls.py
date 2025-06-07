"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


@require_http_methods(["GET"])
def api_root(request):
    """API root endpoint with available endpoints"""
    return JsonResponse({
        "message": "Stock Management System API",
        "version": "1.0.0",
        "endpoints": {
            "authentication": {
                "login": "/api/auth/login/",
                "refresh": "/api/auth/refresh/",
                "current_user": "/api/auth/me/"
            },
            "users": {
                "list_create": "/api/users/",
                "detail": "/api/users/{id}/"
            },
            "products": {
                "list_create": "/api/products/",
                "detail": "/api/products/{id}/"
            },
            "sales": {
                "list_create": "/api/sales/",
                "detail": "/api/sales/{id}/"
            },
            "payments": {
                "list_create": "/api/payments/",
                "detail": "/api/payments/{id}/"
            },
            "reports": {
                "dashboard": "/api/dashboard/",
                "sales": "/api/reports/sales/",
                "inventory": "/api/reports/inventory/"
            },
            "admin": "/admin/"
        }
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api_root'),
    path('', include('salesperson.urls')),
]
