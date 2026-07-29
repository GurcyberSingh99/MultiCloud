"""
URL Configuration for Multi-Cloud Dashboard API.
All API endpoints are prefixed with /api/.
"""

from django.urls import path, include

urlpatterns = [
    path('api/auth/', include('apps.authentication.urls')),
    path('api/cloud/', include('apps.cloud_providers.urls')),
    path('api/vms/', include('apps.virtual_machines.urls')),
    path('api/storage/', include('apps.storage.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/monitoring/', include('apps.monitoring.urls')),
    path('api/alerts/', include('apps.alerts.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]
