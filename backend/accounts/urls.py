"""
URLs for authentication endpoints.
"""

from django.urls import path
from .views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    UserProfileView,
    LogoutView,
    RegisterView,
    ProductListCreateView,
    ProductDetailView,
)

app_name = "accounts"

urlpatterns = [
    # Authentication endpoints
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    
    # User profile
    path("auth/me/", UserProfileView.as_view(), name="user_profile"),
    
    # Product endpoints
    path("products/", ProductListCreateView.as_view(), name="product_list_create"),
    path("products/<int:pk>/", ProductDetailView.as_view(), name="product_detail"),
]

