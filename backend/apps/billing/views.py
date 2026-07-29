"""Billing & Cost API views."""

import random
from datetime import datetime, timedelta, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.cloud_providers.registry import get_adapter, get_all_adapters


class BillingSummaryView(APIView):
    """Get billing summary across all providers."""

    def get(self, request):
        end_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')

        summaries = []
        total_cost = 0
        for name, adapter in get_all_adapters().items():
            summary = adapter.get_billing_summary(start_date, end_date)
            summaries.append(summary)
            total_cost += summary['total_cost']

        return Response({
            'success': True,
            'data': {
                'total_cost': round(total_cost, 2),
                'currency': 'USD',
                'period': {'start': start_date, 'end': end_date},
                'by_provider': summaries,
            },
        })


class BillingDailyView(APIView):
    """Get daily cost breakdown."""

    def get(self, request):
        days = int(request.query_params.get('days', 30))
        end_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime('%Y-%m-%d')

        daily_data = {}
        for name, adapter in get_all_adapters().items():
            result = adapter.get_billing_daily(start_date, end_date)
            for day in result['daily_costs']:
                if day['date'] not in daily_data:
                    daily_data[day['date']] = {'date': day['date'], 'aws': 0, 'azure': 0, 'gcp': 0, 'total': 0}
                daily_data[day['date']][name] = day['cost']
                daily_data[day['date']]['total'] += day['cost']

        # Sort by date
        sorted_daily = sorted(daily_data.values(), key=lambda x: x['date'])
        for d in sorted_daily:
            d['total'] = round(d['total'], 2)

        return Response({
            'success': True,
            'data': {'daily_costs': sorted_daily},
        })


class BillingServicesView(APIView):
    """Get cost breakdown by service."""

    def get(self, request):
        end_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')

        all_services = []
        for name, adapter in get_all_adapters().items():
            result = adapter.get_billing_by_service(start_date, end_date)
            for svc in result['services']:
                svc['provider'] = name
                all_services.append(svc)

        # Sort by cost descending
        all_services.sort(key=lambda x: x['cost'], reverse=True)

        return Response({
            'success': True,
            'data': {'services': all_services},
        })


class BillingForecastView(APIView):
    """Get cost forecast based on trends."""

    def get(self, request):
        end_date = datetime.now(timezone.utc).strftime('%Y-%m-%d')
        start_date = (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d')

        forecasts = []
        for name, adapter in get_all_adapters().items():
            summary = adapter.get_billing_summary(start_date, end_date)
            current = summary['total_cost']
            # Simple linear projection
            growth_rate = summary['change_percent'] / 100
            forecasts.append({
                'provider': name,
                'current_monthly': current,
                'projected_next_month': round(current * (1 + growth_rate), 2),
                'projected_3_months': round(current * (1 + growth_rate) ** 3, 2),
                'trend': 'up' if growth_rate > 0 else 'down',
                'change_percent': summary['change_percent'],
            })

        total_current = sum(f['current_monthly'] for f in forecasts)
        total_projected = sum(f['projected_next_month'] for f in forecasts)

        return Response({
            'success': True,
            'data': {
                'total_current': round(total_current, 2),
                'total_projected': round(total_projected, 2),
                'by_provider': forecasts,
            },
        })


class BillingBudgetsView(APIView):
    """Get budget vs actual spending."""

    def get(self, request):
        budgets = [
            {
                'provider': 'aws',
                'budget': 15000,
                'actual': round(random.uniform(11000, 14000), 2),
                'alert_threshold': 80,
            },
            {
                'provider': 'azure',
                'budget': 10000,
                'actual': round(random.uniform(7000, 9500), 2),
                'alert_threshold': 80,
            },
            {
                'provider': 'gcp',
                'budget': 8000,
                'actual': round(random.uniform(5500, 7500), 2),
                'alert_threshold': 80,
            },
        ]
        for b in budgets:
            b['utilization_percent'] = round((b['actual'] / b['budget']) * 100, 1)
            b['remaining'] = round(b['budget'] - b['actual'], 2)
            b['status'] = 'critical' if b['utilization_percent'] > 90 else 'warning' if b['utilization_percent'] > 80 else 'healthy'

        return Response({'success': True, 'data': {'budgets': budgets}})
