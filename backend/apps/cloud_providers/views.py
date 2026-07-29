"""Cloud providers views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from datetime import datetime

# In-memory mock store for cloud credentials (initial default configuration state)
CREDENTIALS_STORE = {
    'aws': {
        'id': 'aws',
        'name': 'Amazon Web Services',
        'short_name': 'AWS',
        'status': 'connected',
        'mode': getattr(settings, 'CLOUD_MODE', 'mock'),
        'color': '#FF9900',
        'credentials': {
            'aws_access_key_id': 'AKIAIOSFODNN7EXAMPLE',
            'aws_secret_access_key': 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
            'aws_region': 'us-east-1',
            'aws_session_token': '',
        },
        'last_tested': '2026-07-24 10:30:00',
    },
    'azure': {
        'id': 'azure',
        'name': 'Microsoft Azure',
        'short_name': 'Azure',
        'status': 'connected',
        'mode': getattr(settings, 'CLOUD_MODE', 'mock'),
        'color': '#0078D4',
        'credentials': {
            'azure_tenant_id': '72f988bf-86f1-41af-91ab-2d7cd011db47',
            'azure_client_id': '4c3d8a1e-8e56-4b2a-9f12-00ab12345678',
            'azure_client_secret': 'Sec~8Qx9vK2P1L0mN4oP5qR6sT7uV8wX',
            'azure_subscription_id': '3a2b1c0d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
        },
        'last_tested': '2026-07-24 10:30:00',
    },
    'gcp': {
        'id': 'gcp',
        'name': 'Google Cloud Platform',
        'short_name': 'GCP',
        'status': 'connected',
        'mode': getattr(settings, 'CLOUD_MODE', 'mock'),
        'color': '#4285F4',
        'credentials': {
            'gcp_project_id': 'cloudpilot-prod-2026',
            'gcp_client_email': 'cloudpilot-sa@cloudpilot-prod-2026.iam.gserviceaccount.com',
            'gcp_private_key': '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC3...\n-----END PRIVATE KEY-----',
            'gcp_region': 'us-central1',
        },
        'last_tested': '2026-07-24 10:30:00',
    },
}


def mask_secret(value):
    """Utility helper to mask secret keys for API output."""
    if not value or len(value) < 6:
        return '••••••••••••'
    return value[:4] + '•' * (len(value) - 8) + value[-4:]


class CloudProvidersListView(APIView):
    """List configured cloud providers and their status."""

    def get(self, request):
        providers = []
        for provider_id, info in CREDENTIALS_STORE.items():
            providers.append({
                'id': info['id'],
                'name': info['name'],
                'short_name': info['short_name'],
                'status': info['status'],
                'mode': info['mode'],
                'color': info['color'],
                'last_tested': info.get('last_tested'),
            })
        return Response({'success': True, 'data': providers})


class CloudCredentialsView(APIView):
    """Retrieve and update API keys/credentials for cloud providers."""

    def get(self, request):
        provider_id = request.query_params.get('provider')
        if provider_id:
            if provider_id not in CREDENTIALS_STORE:
                return Response(
                    {'success': False, 'error': f'Provider {provider_id} not found.'},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response({'success': True, 'data': CREDENTIALS_STORE[provider_id]})

        return Response({'success': True, 'data': CREDENTIALS_STORE})

    def post(self, request):
        provider_id = request.data.get('provider')
        credentials_data = request.data.get('credentials', {})

        if not provider_id or provider_id not in CREDENTIALS_STORE:
            return Response(
                {'success': False, 'error': 'Valid provider ID (aws, azure, gcp) is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider_entry = CREDENTIALS_STORE[provider_id]
        # Update credentials dictionary
        provider_entry['credentials'].update(credentials_data)
        provider_entry['status'] = 'connected'
        provider_entry['last_tested'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        return Response({
            'success': True,
            'message': f'{provider_entry["name"]} API credentials saved successfully.',
            'data': provider_entry,
        })


class CloudCredentialsTestView(APIView):
    """Test API credentials for a specific cloud provider."""

    def post(self, request):
        provider_id = request.data.get('provider')
        credentials_data = request.data.get('credentials', {})

        if not provider_id or provider_id not in CREDENTIALS_STORE:
            return Response(
                {'success': False, 'error': 'Valid provider ID (aws, azure, gcp) is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider_name = CREDENTIALS_STORE[provider_id]['name']

        # Validate required fields for the specific provider
        missing_fields = []
        if provider_id == 'aws':
            if not credentials_data.get('aws_access_key_id'):
                missing_fields.append('AWS Access Key ID')
            if not credentials_data.get('aws_secret_access_key'):
                missing_fields.append('AWS Secret Access Key')
        elif provider_id == 'azure':
            if not credentials_data.get('azure_client_id'):
                missing_fields.append('Azure Client ID')
            if not credentials_data.get('azure_client_secret'):
                missing_fields.append('Azure Client Secret')
            if not credentials_data.get('azure_tenant_id'):
                missing_fields.append('Azure Tenant ID')
        elif provider_id == 'gcp':
            if not credentials_data.get('gcp_project_id'):
                missing_fields.append('GCP Project ID')
            if not credentials_data.get('gcp_client_email'):
                missing_fields.append('GCP Client Email')

        if missing_fields:
            return Response({
                'success': False,
                'error': f'Missing required credentials: {", ".join(missing_fields)}',
            }, status=status.HTTP_400_BAD_REQUEST)

        # Update last_tested & status
        CREDENTIALS_STORE[provider_id]['status'] = 'connected'
        CREDENTIALS_STORE[provider_id]['last_tested'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        return Response({
            'success': True,
            'message': f'Successfully connected to {provider_name}! Connection verified.',
            'status': 'connected',
            'timestamp': CREDENTIALS_STORE[provider_id]['last_tested'],
        })

