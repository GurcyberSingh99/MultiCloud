"""
JWT token generation utilities.
"""

import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings


def generate_access_token(user_id):
    """Generate a short-lived access token."""
    payload = {
        'user_id': str(user_id),
        'type': 'access',
        'exp': datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def generate_refresh_token(user_id):
    """Generate a long-lived refresh token."""
    payload = {
        'user_id': str(user_id),
        'type': 'refresh',
        'exp': datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_REFRESH_TOKEN_LIFETIME),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token):
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise ValueError('Token has expired.')
    except jwt.InvalidTokenError:
        raise ValueError('Invalid token.')
