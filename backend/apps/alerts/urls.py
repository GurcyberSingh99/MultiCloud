"""Alerts URL patterns."""
from django.urls import path
from .views import AlertListView, AlertAcknowledgeView, AlertRulesView, AlertHistoryView

urlpatterns = [
    path('', AlertListView.as_view(), name='alert-list'),
    path('rules/', AlertRulesView.as_view(), name='alert-rules'),
    path('history/', AlertHistoryView.as_view(), name='alert-history'),
    path('<str:alert_id>/ack/', AlertAcknowledgeView.as_view(), name='alert-acknowledge'),
]
