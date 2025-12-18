from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Product


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    """Admin interface for CustomUser model."""

    model = CustomUser
    
    # List display
    list_display = ("email", "first_name", "last_name", "phone_number", "is_staff", "is_active")
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")

    # Form fieldsets
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone_number", "address")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )

    ordering = ("email",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin interface for Product model."""

    model = Product
    
    # List display
    list_display = ("name", "price", "quantity", "creator", "created_at", "updated_at")
    list_filter = ("created_at", "updated_at", "creator")
    search_fields = ("name", "description", "creator__email")
    readonly_fields = ("created_at", "updated_at", "creator")

    # Fieldsets
    fieldsets = (
        ("Product Info", {"fields": ("name", "description", "price", "quantity")}),
        ("Creator", {"fields": ("creator",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )

    def save_model(self, request, obj, form, change):
        """Set creator to current user when creating new product."""
        if not change:  # If creating new object
            obj.creator = request.user
        super().save_model(request, obj, form, change)

