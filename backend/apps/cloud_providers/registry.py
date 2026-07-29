"""
Adapter registry — returns the appropriate cloud adapter based on settings.
"""

from django.conf import settings
from .mock_adapter import MockAdapter


# Cache adapter instances
_adapters = {}


def get_adapter(provider):
    """
    Get the cloud adapter for a given provider.

    Args:
        provider: 'aws', 'azure', or 'gcp'

    Returns:
        CloudAdapter instance
    """
    if provider not in ('aws', 'azure', 'gcp'):
        raise ValueError(f"Unknown cloud provider: {provider}")

    cache_key = f"{settings.CLOUD_MODE}_{provider}"
    if cache_key not in _adapters:
        if settings.CLOUD_MODE == 'mock':
            _adapters[cache_key] = MockAdapter(provider)
        else:
            # Live adapters — import only when needed to avoid
            # ImportError if cloud SDKs aren't installed
            if provider == 'aws':
                from .aws_adapter import AWSAdapter
                _adapters[cache_key] = AWSAdapter()
            elif provider == 'azure':
                from .azure_adapter import AzureAdapter
                _adapters[cache_key] = AzureAdapter()
            elif provider == 'gcp':
                from .gcp_adapter import GCPAdapter
                _adapters[cache_key] = GCPAdapter()

    return _adapters[cache_key]


def get_all_adapters():
    """Get adapters for all three cloud providers."""
    return {
        'aws': get_adapter('aws'),
        'azure': get_adapter('azure'),
        'gcp': get_adapter('gcp'),
    }
