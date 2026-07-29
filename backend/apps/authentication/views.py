"""
Authentication API views.
"""

from datetime import datetime, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
import bcrypt
from bson import ObjectId

from core.mongodb import get_collection
from .serializers import RegisterSerializer, LoginSerializer, RefreshSerializer
from .tokens import generate_access_token, generate_refresh_token, decode_token


class RegisterView(APIView):
    """Register a new user."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        users = get_collection('users')

        # Check if email already exists
        if users.find_one({'email': serializer.validated_data['email']}):
            return Response(
                {'success': False, 'error': 'Email already registered.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Hash password
        password_hash = bcrypt.hashpw(
            serializer.validated_data['password'].encode('utf-8'),
            bcrypt.gensalt(),
        ).decode('utf-8')

        # Create user document
        user_doc = {
            'name': serializer.validated_data['name'],
            'email': serializer.validated_data['email'],
            'password_hash': password_hash,
            'role': 'admin',
            'is_active': True,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        }

        result = users.insert_one(user_doc)
        user_id = str(result.inserted_id)

        # Generate tokens
        access_token = generate_access_token(user_id)
        refresh_token = generate_refresh_token(user_id)

        return Response({
            'success': True,
            'data': {
                'user': {
                    'id': user_id,
                    'name': user_doc['name'],
                    'email': user_doc['email'],
                    'role': user_doc['role'],
                },
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token,
                },
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """Authenticate user and return JWT tokens."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        users = get_collection('users')
        user_doc = users.find_one({'email': serializer.validated_data['email']})

        if not user_doc:
            return Response(
                {'success': False, 'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Verify password
        if not bcrypt.checkpw(
            serializer.validated_data['password'].encode('utf-8'),
            user_doc['password_hash'].encode('utf-8'),
        ):
            return Response(
                {'success': False, 'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user_doc.get('is_active', True):
            return Response(
                {'success': False, 'error': 'Account is deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        user_id = str(user_doc['_id'])

        # Update last login
        users.update_one(
            {'_id': user_doc['_id']},
            {'$set': {'last_login': datetime.now(timezone.utc)}},
        )

        # Generate tokens
        access_token = generate_access_token(user_id)
        refresh_token = generate_refresh_token(user_id)

        return Response({
            'success': True,
            'data': {
                'user': {
                    'id': user_id,
                    'name': user_doc['name'],
                    'email': user_doc['email'],
                    'role': user_doc.get('role', 'viewer'),
                },
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token,
                },
            }
        })


class RefreshTokenView(APIView):
    """Refresh an access token using a refresh token."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = decode_token(serializer.validated_data['refresh_token'])
        except ValueError as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if payload.get('type') != 'refresh':
            return Response(
                {'success': False, 'error': 'Invalid token type.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Verify user still exists and is active
        users = get_collection('users')
        try:
            user_doc = users.find_one({'_id': ObjectId(payload['user_id'])})
        except Exception:
            return Response(
                {'success': False, 'error': 'Invalid user.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user_doc or not user_doc.get('is_active', True):
            return Response(
                {'success': False, 'error': 'User not found or deactivated.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Generate new access token
        access_token = generate_access_token(payload['user_id'])

        return Response({
            'success': True,
            'data': {
                'access': access_token,
            }
        })


class ProfileView(APIView):
    """Get or update the authenticated user's profile."""

    def get(self, request):
        return Response({
            'success': True,
            'data': request.user.to_dict(),
        })

    def put(self, request):
        users = get_collection('users')
        update_fields = {}

        if 'name' in request.data:
            update_fields['name'] = request.data['name']

        if not update_fields:
            return Response(
                {'success': False, 'error': 'No fields to update.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        update_fields['updated_at'] = datetime.now(timezone.utc)
        users.update_one(
            {'_id': ObjectId(request.user.id)},
            {'$set': update_fields},
        )

        # Fetch updated user
        user_doc = users.find_one({'_id': ObjectId(request.user.id)})
        from .backends import MongoUser
        user = MongoUser(user_doc)

        return Response({
            'success': True,
            'data': user.to_dict(),
        })
