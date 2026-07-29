"""Monitoring & Metrics API views."""

import random
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.cloud_providers.registry import get_adapter, get_all_adapters


class MetricsView(APIView):
    """Get metrics for a specific resource."""

    def get(self, request):
        resource_id = request.query_params.get('resource_id', 'aws-vm-001')
        metric_type = request.query_params.get('metric', 'cpu')
        period = request.query_params.get('period', '24h')
        provider = resource_id.split('-')[0] if '-' in resource_id else 'aws'

        adapter = get_adapter(provider)
        metrics = adapter.get_metrics(resource_id, metric_type, period)

        return Response({'success': True, 'data': metrics})


class NetworkMetricsView(APIView):
    """Get network I/O metrics."""

    def get(self, request):
        resource_id = request.query_params.get('resource_id', 'aws-vm-001')
        period = request.query_params.get('period', '24h')
        provider = resource_id.split('-')[0] if '-' in resource_id else 'aws'

        adapter = get_adapter(provider)
        network_in = adapter.get_metrics(resource_id, 'network_in', period)
        network_out = adapter.get_metrics(resource_id, 'network_out', period)

        return Response({
            'success': True,
            'data': {
                'network_in': network_in,
                'network_out': network_out,
            },
        })


class HealthStatusView(APIView):
    """Get health status of all resources across providers."""

    def get(self, request):
        provider = request.query_params.get('provider')
        all_health = []

        if provider:
            adapter = get_adapter(provider)
            all_health = adapter.get_health_status()
        else:
            for name, adapter in get_all_adapters().items():
                all_health.extend(adapter.get_health_status())

        summary = {
            'healthy': len([h for h in all_health if h['health'] == 'healthy']),
            'warning': len([h for h in all_health if h['health'] == 'warning']),
            'critical': len([h for h in all_health if h['health'] == 'critical']),
            'stopped': len([h for h in all_health if h['health'] == 'stopped']),
        }

        return Response({
            'success': True,
            'data': {
                'summary': summary,
                'resources': all_health,
            },
        })


class UtilizationView(APIView):
    """Get overall resource utilization."""

    def get(self, request):
        all_health = []
        for name, adapter in get_all_adapters().items():
            all_health.extend(adapter.get_health_status())

        running = [h for h in all_health if h['health'] != 'stopped']

        avg_cpu = sum(h['cpu_usage'] for h in running) / len(running) if running else 0
        avg_memory = sum(h['memory_usage'] for h in running) / len(running) if running else 0
        avg_disk = sum(h['disk_usage'] for h in running) / len(running) if running else 0

        return Response({
            'success': True,
            'data': {
                'total_resources': len(all_health),
                'running_resources': len(running),
                'avg_cpu_usage': round(avg_cpu, 1),
                'avg_memory_usage': round(avg_memory, 1),
                'avg_disk_usage': round(avg_disk, 1),
                'by_provider': {
                    name: {
                        'count': len([h for h in all_health if h['provider'] == name]),
                        'running': len([h for h in running if h['provider'] == name]),
                    }
                    for name in ['aws', 'azure', 'gcp']
                },
            },
        })
