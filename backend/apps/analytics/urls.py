"""Analytics URL patterns."""
from django.urls import path
from .views import DistributionView, TrendsView, OptimizationView, ComparisonView

urlpatterns = [
    path('distribution/', DistributionView.as_view(), name='analytics-distribution'),
    path('trends/', TrendsView.as_view(), name='analytics-trends'),
    path('optimization/', OptimizationView.as_view(), name='analytics-optimization'),
    path('comparison/', ComparisonView.as_view(), name='analytics-comparison'),
]
