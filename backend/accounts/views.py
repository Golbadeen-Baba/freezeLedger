"""
Authentication views for login, refresh, logout, and user profile.
All tokens are stored in HttpOnly cookies, never returned in JSON.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model, authenticate
from django.conf import settings
from django.shortcuts import get_object_or_404

from .serializers import CustomTokenObtainPairSerializer, UserSerializer, ProductSerializer
from .models import Product

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Override to:
    1. Accept email instead of username
    2. Set tokens in HttpOnly cookies
    3. NOT return tokens in JSON
    
    Security rationale:
    - HttpOnly cookies prevent XSS token theft
    - SameSite=Lax allows cross-site requests but prevents CSRF
    - Secure flag ensures HTTPS in production
    """

    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        """Override to set tokens in cookies."""
        # Get serializer with credentials
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Manually authenticate and generate tokens
        email = request.data.get("email")
        password = request.data.get("password")
        
        user = authenticate(request, email=email, password=password)
        
        if user is None:
            return Response(
                {"detail": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token

        # Create response
        response = Response(
            {"detail": "Login successful"},
            status=status.HTTP_200_OK
        )

        # Set cookies with security flags
        response.set_cookie(
            "access_token",
            str(access),
            max_age=5 * 60,  # 5 minutes
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="Lax",
            path="/",
        )

        response.set_cookie(
            "refresh_token",
            str(refresh),
            max_age=7 * 24 * 60 * 60,  # 7 days
            httponly=True,
            secure=settings.SECURE_COOKIES,
            samesite="Lax",
            path="/",
        )

        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Override to read refresh token from cookies and set new access token in cookie.
    
    Security rationale:
    - Reads refresh token from HttpOnly cookie
    - Returns new access token in HttpOnly cookie
    - Never exposes tokens in JSON
    """

    def post(self, request, *args, **kwargs):
        """Override to get refresh token from cookies."""
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "No refresh token provided"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token

            response = Response(
                {"detail": "Token refreshed"},
                status=status.HTTP_200_OK
            )

            response.set_cookie(
                "access_token",
                str(access),
                max_age=5 * 60,  # 5 minutes
                httponly=True,
                secure=settings.SECURE_COOKIES,
                samesite="Lax",
                path="/",
            )

            return response
        except TokenError:
            return Response(
                {"detail": "Invalid refresh token"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class UserProfileView(APIView):
    """
    Get authenticated user's profile.
    Endpoint: GET /api/auth/me/
    
    Returns user data if authenticated via cookie.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return authenticated user's profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    Logout user by deleting cookies and blacklisting refresh token.
    Endpoint: POST /api/auth/logout/
    
    Security rationale:
    - Deletes HttpOnly cookies (client-side can't do this)
    - Blacklists refresh token (requires djangorestframework-simplejwt.token_blacklist)
    - Prevents token reuse even if stolen
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Delete cookies and blacklist refresh token."""
        refresh_token = request.COOKIES.get("refresh_token")

        try:
            if refresh_token:
                # Blacklist the refresh token
                token = RefreshToken(refresh_token)
                token.blacklist()
        except TokenError:
            pass  # Token might already be blacklisted or invalid

        # Create response with cleared cookies
        response = Response(
            {"detail": "Logout successful"},
            status=status.HTTP_200_OK
        )

        # Delete cookies by setting max_age=0
        response.delete_cookie("access_token", path="/", samesite="Lax")
        response.delete_cookie("refresh_token", path="/", samesite="Lax")

        return response


class RegisterView(APIView):
    """
    Register a new user account.
    Endpoint: POST /api/auth/register/
    
    Accepts:
    - email (required, unique)
    - password (required)
    - first_name (optional)
    - last_name (optional)
    - phone_number (optional)
    - address (optional)
    """

    permission_classes = [AllowAny]

    def post(self, request):
        """Create a new user account."""
        email = request.data.get("email")
        password = request.data.get("password")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        phone_number = request.data.get("phone_number", "")
        address = request.data.get("address", "")

        # Validate required fields
        if not email or not password:
            return Response(
                {"detail": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"detail": "User with this email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone_number=phone_number,
                address=address,
            )

            return Response(
                {"detail": "User created successfully"},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ============================================================================
# PRODUCT CRUD ENDPOINTS
# ============================================================================

class ProductListCreateView(APIView):
    """
    List all products and create new products.
    
    GET: List all products (requires authentication)
    POST: Create a new product (requires authentication, creator is set to user)
    
    Endpoint: GET/POST /api/products/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all products."""
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """Create a new product."""
        serializer = ProductSerializer(data=request.data)
        
        if serializer.is_valid():
            # Set creator to authenticated user
            serializer.save(creator=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductDetailView(APIView):
    """
    Retrieve, update, or delete a single product.
    
    GET: Get product details
    PUT: Update product (only creator can update)
    DELETE: Delete product (only creator can delete)
    
    Endpoint: GET/PUT/DELETE /api/products/{id}/
    """

    permission_classes = [IsAuthenticated]

    def get_product(self, pk):
        """Helper to get product or raise 404."""
        return get_object_or_404(Product, pk=pk)

    def get(self, request, pk):
        """Get product details."""
        product = self.get_product(pk)
        serializer = ProductSerializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        """Update product (only creator can update)."""
        product = self.get_product(pk)

        # Check if user is the creator
        if product.creator.id != request.user.id:
            return Response(
                {"detail": "You can only update your own products"},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ProductSerializer(product, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Delete product (only creator can delete)."""
        product = self.get_product(pk)

        # Check if user is the creator
        if product.creator.id != request.user.id:
            return Response(
                {"detail": "You can only delete your own products"},
                status=status.HTTP_403_FORBIDDEN
            )

        product.delete()
        return Response(
            {"detail": "Product deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
