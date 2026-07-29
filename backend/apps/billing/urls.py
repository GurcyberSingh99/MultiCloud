"""Billing URL patterns."""
from django.urls import path
from .views import BillingSummaryView, BillingDailyView, BillingServicesView, BillingForecastView, BillingBudgetsView

urlpatterns = [
    path('summary/', BillingSummaryView.as_view(), name='billing-summary'),
    path('daily/', BillingDailyView.as_view(), name='billing-daily'),
    path('services/', BillingServicesView.as_view(), name='billing-services'),
    path('forecast/', BillingForecastView.as_view(), name='billing-forecast'),
    path('budgets/', BillingBudgetsView.as_view(), name='billing-budgets'),
]
