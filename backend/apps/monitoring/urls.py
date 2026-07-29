"""Monitoring URL patterns."""
from django.urls import path
from .views import MetricsView, NetworkMetricsView, HealthStatusView, UtilizationView

urlpatterns = [
    path('metrics/', MetricsView.as_view(), name='monitoring-metrics'),
    path('network/', NetworkMetricsView.as_view(), name='monitoring-network'),
    path('health/', HealthStatusView.as_view(), name='monitoring-health'),
    path('utilization/', UtilizationView.as_view(), name='monitoring-utilization'),
]
