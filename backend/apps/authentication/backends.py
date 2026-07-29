"""
Custom JWT Authentication backend for DRF.
Uses PyMongo to validate tokens against MongoDB-stored users.
"""

import jwt
from datetime import datetime, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from core.mongodb import get_collection


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication class for Django REST Framework.
    Validates Bearer tokens and attaches user info to the request.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token.')

        # Verify token type
        if payload.get('type') != 'access':
            raise exceptions.AuthenticationFailed('Invalid token type.')

        # Look up user in MongoDB
        users = get_collection('users')
        from bson import ObjectId
        try:
            user_doc = users.find_one({'_id': ObjectId(payload['user_id'])})
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid user ID in token.')

        if not user_doc:
            raise exceptions.AuthenticationFailed('User not found.')

        # Create a lightweight user object for DRF
        user = MongoUser(user_doc)
        return (user, token)

    def authenticate_header(self, request):
        return 'Bearer'


class MongoUser:
    """
    Lightweight user object that wraps a MongoDB user document.
    Compatible with DRF's request.user interface.
    """

    def __init__(self, user_doc):
        self._doc = user_doc
        self.id = str(user_doc['_id'])
        self.email = user_doc.get('email', '')
        self.name = user_doc.get('name', '')
        self.role = user_doc.get('role', 'viewer')
        self.is_authenticated = True
        self.is_active = user_doc.get('is_active', True)

    def __str__(self):
        return self.email

    @property
    def is_anonymous(self):
        return False

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self._doc.get('created_at', '').isoformat()
                if hasattr(self._doc.get('created_at', ''), 'isoformat') else '',
        }
