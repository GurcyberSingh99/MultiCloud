"""Virtual Machines URL patterns."""
from django.urls import path
from .views import VMListView, VMDetailView, VMActionView

urlpatterns = [
    path('', VMListView.as_view(), name='vm-list'),
    path('<str:vm_id>/', VMDetailView.as_view(), name='vm-detail'),
    path('<str:vm_id>/action/', VMActionView.as_view(), name='vm-action'),
]
