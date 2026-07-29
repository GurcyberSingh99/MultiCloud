"""Storage URL patterns."""
from django.urls import path
from .views import StorageListView, StorageDetailView, StorageStatsView

urlpatterns = [
    path('', StorageListView.as_view(), name='storage-list'),
    path('stats/', StorageStatsView.as_view(), name='storage-stats'),
    path('<str:storage_id>/', StorageDetailView.as_view(), name='storage-detail'),
]
