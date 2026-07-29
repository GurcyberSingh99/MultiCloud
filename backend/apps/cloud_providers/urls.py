"""Cloud providers URL patterns."""

from django.urls import path
from .views import CloudProvidersListView, CloudCredentialsView, CloudCredentialsTestView

urlpatterns = [
    path('providers/', CloudProvidersListView.as_view(), name='cloud-providers'),
    path('credentials/', CloudCredentialsView.as_view(), name='cloud-credentials'),
    path('credentials/test/', CloudCredentialsTestView.as_view(), name='cloud-credentials-test'),
]

