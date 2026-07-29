"""Alerts API views."""

import random
from datetime import datetime, timedelta, timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from bson import ObjectId
from core.mongodb import get_collection


# Seed some realistic alerts into memory for demo
MOCK_ALERTS = [
    {'severity': 'critical', 'provider': 'aws', 'resource': 'web-server-prod-1', 'message': 'CPU usage exceeded 95% for 15 minutes', 'type': 'cpu_threshold', 'acknowledged': False},
    {'severity': 'warning', 'provider': 'azure', 'resource': 'sql-server-vm', 'message': 'Memory usage at 88% — approaching limit', 'type': 'memory_threshold', 'acknowledged': False},
    {'severity': 'critical', 'provider': 'gcp', 'resource': 'backend-api', 'message': 'Disk usage at 92% — immediate action required', 'type': 'disk_threshold', 'acknowledged': False},
    {'severity': 'info', 'provider': 'aws', 'resource': 'prod-assets-bucket', 'message': 'S3 bucket size exceeded 2TB', 'type': 'storage_size', 'acknowledged': True},
    {'severity': 'warning', 'provider': 'aws', 'resource': 'api-server-prod-1', 'message': 'Network latency spike detected (>200ms avg)', 'type': 'network_latency', 'acknowledged': False},
    {'severity': 'info', 'provider': 'azure', 'resource': 'devops-agent-1', 'message': 'Scheduled maintenance window approaching', 'type': 'maintenance', 'acknowledged': True},
    {'severity': 'warning', 'provider': 'gcp', 'resource': 'data-pipeline', 'message': 'Error rate increased to 2.3% in the last hour', 'type': 'error_rate', 'acknowledged': False},
    {'severity': 'critical', 'provider': 'aws', 'resource': 'db-replica-1', 'message': 'Replication lag exceeded 30 seconds', 'type': 'replication_lag', 'acknowledged': False},
    {'severity': 'info', 'provider': 'gcp', 'resource': 'frontend-prod', 'message': 'SSL certificate expires in 14 days', 'type': 'ssl_expiry', 'acknowledged': False},
    {'severity': 'warning', 'provider': 'azure', 'resource': 'k8s-node-1', 'message': 'Pod restart count exceeded threshold (5 restarts/hour)', 'type': 'pod_restarts', 'acknowledged': False},
]

# Enrich with timestamps and IDs
for i, alert in enumerate(MOCK_ALERTS):
    alert['id'] = f'alert-{i+1:03d}'
    alert['created_at'] = (datetime.now(timezone.utc) - timedelta(minutes=random.randint(5, 2880))).isoformat()
    alert['updated_at'] = alert['created_at']


class AlertListView(APIView):
    """List alerts with filtering."""

    def get(self, request):
        severity = request.query_params.get('severity')
        provider = request.query_params.get('provider')
        acknowledged = request.query_params.get('acknowledged')

        alerts = MOCK_ALERTS.copy()

        if severity:
            alerts = [a for a in alerts if a['severity'] == severity]
        if provider:
            alerts = [a for a in alerts if a['provider'] == provider]
        if acknowledged is not None:
            ack_bool = acknowledged.lower() == 'true'
            alerts = [a for a in alerts if a['acknowledged'] == ack_bool]

        # Sort by severity (critical > warning > info) then by date
        severity_order = {'critical': 0, 'warning': 1, 'info': 2}
        alerts.sort(key=lambda a: (severity_order.get(a['severity'], 9), a['created_at']))

        summary = {
            'total': len(MOCK_ALERTS),
            'critical': len([a for a in MOCK_ALERTS if a['severity'] == 'critical']),
            'warning': len([a for a in MOCK_ALERTS if a['severity'] == 'warning']),
            'info': len([a for a in MOCK_ALERTS if a['severity'] == 'info']),
            'unacknowledged': len([a for a in MOCK_ALERTS if not a['acknowledged']]),
        }

        return Response({
            'success': True,
            'data': {
                'summary': summary,
                'alerts': alerts,
            },
        })


class AlertAcknowledgeView(APIView):
    """Acknowledge an alert."""

    def post(self, request, alert_id):
        for alert in MOCK_ALERTS:
            if alert['id'] == alert_id:
                alert['acknowledged'] = True
                alert['updated_at'] = datetime.now(timezone.utc).isoformat()
                alert['acknowledged_by'] = getattr(request.user, 'email', 'admin')
                return Response({'success': True, 'data': alert})

        return Response(
            {'success': False, 'error': 'Alert not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )


class AlertRulesView(APIView):
    """Manage alert rules."""

    def get(self, request):
        rules = [
            {'id': 'rule-001', 'name': 'High CPU Alert', 'metric': 'cpu', 'operator': '>', 'threshold': 90, 'duration': '15m', 'severity': 'critical', 'enabled': True, 'providers': ['aws', 'azure', 'gcp']},
            {'id': 'rule-002', 'name': 'Memory Warning', 'metric': 'memory', 'operator': '>', 'threshold': 85, 'duration': '10m', 'severity': 'warning', 'enabled': True, 'providers': ['aws', 'azure', 'gcp']},
            {'id': 'rule-003', 'name': 'Disk Space Critical', 'metric': 'disk', 'operator': '>', 'threshold': 90, 'duration': '5m', 'severity': 'critical', 'enabled': True, 'providers': ['aws', 'azure', 'gcp']},
            {'id': 'rule-004', 'name': 'Network Latency', 'metric': 'latency', 'operator': '>', 'threshold': 200, 'duration': '5m', 'severity': 'warning', 'enabled': True, 'providers': ['aws']},
            {'id': 'rule-005', 'name': 'Error Rate Spike', 'metric': 'error_rate', 'operator': '>', 'threshold': 5, 'duration': '10m', 'severity': 'critical', 'enabled': False, 'providers': ['gcp']},
        ]
        return Response({'success': True, 'data': {'rules': rules}})

    def post(self, request):
        rule = {
            'id': f'rule-{random.randint(100, 999)}',
            'name': request.data.get('name', 'New Rule'),
            'metric': request.data.get('metric', 'cpu'),
            'operator': request.data.get('operator', '>'),
            'threshold': request.data.get('threshold', 90),
            'duration': request.data.get('duration', '5m'),
            'severity': request.data.get('severity', 'warning'),
            'enabled': True,
            'providers': request.data.get('providers', ['aws', 'azure', 'gcp']),
        }
        return Response({'success': True, 'data': rule}, status=status.HTTP_201_CREATED)


class AlertHistoryView(APIView):
    """Get alert history timeline."""

    def get(self, request):
        history = []
        for i in range(20):
            history.append({
                'id': f'hist-{i+1:03d}',
                'alert_type': random.choice(['cpu_threshold', 'memory_threshold', 'disk_threshold', 'network_latency', 'error_rate']),
                'severity': random.choice(['critical', 'warning', 'info']),
                'provider': random.choice(['aws', 'azure', 'gcp']),
                'resource': random.choice(['web-server-prod-1', 'sql-server-vm', 'backend-api', 'db-replica-1', 'data-pipeline']),
                'message': random.choice(['CPU spike resolved', 'Memory usage normalized', 'Disk cleanup completed', 'Latency returned to normal', 'Error rate dropped below threshold']),
                'status': random.choice(['resolved', 'acknowledged', 'triggered']),
                'created_at': (datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 720))).isoformat(),
                'resolved_at': (datetime.now(timezone.utc) - timedelta(hours=random.randint(0, 48))).isoformat() if random.random() > 0.3 else None,
            })
        history.sort(key=lambda h: h['created_at'], reverse=True)
        return Response({'success': True, 'data': {'history': history}})
