"""
Custom authentication class that reads JWT only from HttpOnly cookies.
Never expects Authorization headers.
"""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from rest_framework.exceptions import AuthenticationFailed as DRFAuthenticationFailed
from django.http import HttpRequest


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from HttpOnly cookies only.
    
    Security rationale:
    - Reads only from 'access_token' cookie (not Authorization header)
    - Prevents XSS from stealing tokens (HttpOnly flag)
    - Compatible with CSRF protection (SameSite=Lax)
    """

    def authenticate(self, request: HttpRequest):
        """
        Extract JWT from cookies instead of Authorization header.
        Returns (user, token) or None if not authenticated.
        """
        # Try to get access token from cookies
        access_token = request.COOKIES.get("access_token", None)

        if access_token is None:
            # No token in cookies means unauthenticated, but not an error
            return None

        try:
            # Validate the token using parent class method
            validated_token = self.get_validated_token(access_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except InvalidToken:
            raise AuthenticationFailed("Invalid access token")
        except Exception as exc:
            raise AuthenticationFailed(str(exc))
