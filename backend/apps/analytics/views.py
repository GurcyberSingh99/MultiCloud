"""Analytics API views."""

import random
from datetime import datetime, timedelta, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.cloud_providers.registry import get_all_adapters


class DistributionView(APIView):
    """Resource distribution across providers."""

    def get(self, request):
        distribution = {'vms': [], 'storage': [], 'total_resources': 0}

        for name, adapter in get_all_adapters().items():
            vms = adapter.list_vms()
            storage = adapter.list_storage()

            distribution['vms'].append({
                'provider': name,
                'count': len(vms),
                'running': len([v for v in vms if v['status'] == 'running']),
                'stopped': len([v for v in vms if v['status'] == 'stopped']),
            })
            distribution['storage'].append({
                'provider': name,
                'count': len(storage),
                'total_size_gb': sum(s['size_gb'] for s in storage),
            })
            distribution['total_resources'] += len(vms) + len(storage)

        return Response({'success': True, 'data': distribution})


class TrendsView(APIView):
    """Usage trends over time."""

    def get(self, request):
        months = []
        for i in range(6):
            date = datetime.now(timezone.utc) - timedelta(days=30 * (5 - i))
            months.append({
                'month': date.strftime('%Y-%m'),
                'label': date.strftime('%b %Y'),
                'aws': {'vms': random.randint(12, 18), 'cost': round(random.uniform(10000, 15000), 2), 'storage_tb': round(random.uniform(20, 30), 1)},
                'azure': {'vms': random.randint(8, 14), 'cost': round(random.uniform(7000, 11000), 2), 'storage_tb': round(random.uniform(8, 15), 1)},
                'gcp': {'vms': random.randint(6, 12), 'cost': round(random.uniform(5000, 8000), 2), 'storage_tb': round(random.uniform(15, 25), 1)},
            })

        return Response({'success': True, 'data': {'trends': months}})


class OptimizationView(APIView):
    """Cost optimization recommendations."""

    def get(self, request):
        recommendations = [
            {
                'id': 'opt-001',
                'title': 'Right-size underutilized EC2 instances',
                'description': '3 instances in us-east-1 are running at <15% CPU utilization. Downsizing from m5.xlarge to t3.medium could save approximately $420/month.',
                'provider': 'aws',
                'potential_savings': 420.00,
                'effort': 'low',
                'impact': 'high',
                'category': 'compute',
                'affected_resources': ['web-server-prod-1', 'batch-worker-1', 'staging-server'],
            },
            {
                'id': 'opt-002',
                'title': 'Move infrequently accessed blobs to Archive tier',
                'description': 'Analysis shows 4.2TB of blob data hasn\'t been accessed in 90+ days. Moving to Archive tier saves ~65% on storage costs.',
                'provider': 'azure',
                'potential_savings': 285.00,
                'effort': 'medium',
                'impact': 'medium',
                'category': 'storage',
                'affected_resources': ['prodmediastore', 'devtestdata'],
            },
            {
                'id': 'opt-003',
                'title': 'Enable committed use discounts for GCP VMs',
                'description': 'Your 4 long-running Compute Engine instances qualify for 1-year committed use discounts, saving up to 37% on compute costs.',
                'provider': 'gcp',
                'potential_savings': 890.00,
                'effort': 'low',
                'impact': 'high',
                'category': 'compute',
                'affected_resources': ['frontend-prod', 'backend-api', 'data-pipeline', 'dev-sandbox'],
            },
            {
                'id': 'opt-004',
                'title': 'Delete unused EBS snapshots',
                'description': '47 orphaned EBS snapshots totaling 2.3TB are no longer associated with any running instance.',
                'provider': 'aws',
                'potential_savings': 115.00,
                'effort': 'low',
                'impact': 'low',
                'category': 'storage',
                'affected_resources': [],
            },
            {
                'id': 'opt-005',
                'title': 'Consolidate underused Azure SQL databases',
                'description': '2 Azure SQL databases are running at <5% DTU utilization and could be merged into an elastic pool.',
                'provider': 'azure',
                'potential_savings': 340.00,
                'effort': 'high',
                'impact': 'medium',
                'category': 'database',
                'affected_resources': ['sql-server-vm'],
            },
        ]

        total_savings = sum(r['potential_savings'] for r in recommendations)

        return Response({
            'success': True,
            'data': {
                'total_potential_savings': round(total_savings, 2),
                'recommendation_count': len(recommendations),
                'recommendations': recommendations,
            },
        })


class ComparisonView(APIView):
    """Provider comparison analytics."""

    def get(self, request):
        comparison = []
        for name, adapter in get_all_adapters().items():
            vms = adapter.list_vms()
            storage = adapter.list_storage()
            summary = adapter.get_billing_summary(
                (datetime.now(timezone.utc) - timedelta(days=30)).strftime('%Y-%m-%d'),
                datetime.now(timezone.utc).strftime('%Y-%m-%d'),
            )

            running_vms = [v for v in vms if v['status'] == 'running']
            total_vcpus = sum(v['cpu_cores'] for v in running_vms)
            total_memory = sum(v['memory_gb'] for v in running_vms)

            comparison.append({
                'provider': name,
                'total_vms': len(vms),
                'running_vms': len(running_vms),
                'total_vcpus': total_vcpus,
                'total_memory_gb': total_memory,
                'storage_buckets': len(storage),
                'total_storage_gb': sum(s['size_gb'] for s in storage),
                'monthly_cost': summary['total_cost'],
                'cost_per_vm': round(summary['total_cost'] / len(vms), 2) if vms else 0,
                'cost_per_vcpu': round(summary['total_cost'] / total_vcpus, 2) if total_vcpus else 0,
            })

        return Response({'success': True, 'data': {'comparison': comparison}})
