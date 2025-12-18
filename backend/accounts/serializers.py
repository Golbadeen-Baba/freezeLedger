"""
Serializers for authentication and user data.
"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from .models import Product

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer for obtaining JWT tokens.
    
    Override to use email instead of username.
    Tokens will NOT be returned here - they'll be in cookies.
    """

    username_field = User.USERNAME_FIELD  # This will be 'email'

    def validate(self, attrs):
        """Validate credentials and prepare tokens (not returned)."""
        data = super().validate(attrs)
        # Remove tokens from response - they'll be in cookies
        return {}


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile data."""

    class Meta:
        model = User
        fields = ("id", "email", "first_name", "last_name", "phone_number", "address")
        read_only_fields = ("id",)


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model.
    
    - creator_email: Read-only field showing creator's email
    - creator_id: Read-only field showing creator's ID
    - Can only be created/updated/deleted by authenticated users
    - Creator is automatically set to the authenticated user on creation
    """

    creator_email = serializers.CharField(source="creator.email", read_only=True)
    creator_id = serializers.IntegerField(source="creator.id", read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "description",
            "price",
            "quantity",
            "creator_id",
            "creator_email",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "creator_id", "creator_email", "created_at", "updated_at")
