"""
Custom exception handler for DRF.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler that normalizes error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_response = {
            'success': False,
            'error': {
                'status_code': response.status_code,
                'message': _extract_message(response.data),
                'details': response.data,
            }
        }
        response.data = custom_response
        return response

    # Handle unexpected errors
    return Response({
        'success': False,
        'error': {
            'status_code': 500,
            'message': 'An unexpected error occurred.',
            'details': str(exc),
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _extract_message(data):
    """Extract a human-readable message from DRF error data."""
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        # Get the first error message
        for key, value in data.items():
            if isinstance(value, list):
                return f"{key}: {value[0]}"
            return f"{key}: {value}"
    if isinstance(data, list):
        return str(data[0])
    return str(data)
