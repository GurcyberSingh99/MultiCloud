"""
Mock cloud adapter with realistic simulated data.
Used when CLOUD_MODE=mock in settings.
All response shapes mirror real cloud API responses for seamless switching.
"""

import random
import math
from datetime import datetime, timedelta, timezone
from .base_adapter import CloudAdapter


class MockAdapter(CloudAdapter):
    """Generates realistic mock data for development and demos."""

    def __init__(self, provider):
        self.provider = provider  # 'aws', 'azure', or 'gcp'
        self._vms = self._generate_vms()
        self._storage = self._generate_storage()

    # ── VM Operations ──────────────────────────────

    def _generate_vms(self):
        vm_configs = {
            'aws': [
                {'name': 'web-server-prod-1', 'type': 't3.large', 'region': 'us-east-1', 'status': 'running', 'cpu': 2, 'memory': 8, 'ip': '54.92.128.47'},
                {'name': 'api-server-prod-1', 'type': 'm5.xlarge', 'region': 'us-east-1', 'status': 'running', 'cpu': 4, 'memory': 16, 'ip': '3.87.154.23'},
                {'name': 'db-replica-1', 'type': 'r5.2xlarge', 'region': 'us-west-2', 'status': 'running', 'cpu': 8, 'memory': 64, 'ip': '52.24.89.112'},
                {'name': 'ml-training-gpu', 'type': 'p3.2xlarge', 'region': 'us-west-2', 'status': 'stopped', 'cpu': 8, 'memory': 61, 'ip': '—'},
                {'name': 'staging-server', 'type': 't3.medium', 'region': 'eu-west-1', 'status': 'running', 'cpu': 2, 'memory': 4, 'ip': '18.203.76.55'},
                {'name': 'batch-worker-1', 'type': 'c5.xlarge', 'region': 'us-east-1', 'status': 'running', 'cpu': 4, 'memory': 8, 'ip': '34.201.92.88'},
            ],
            'azure': [
                {'name': 'webapp-prod-vm', 'type': 'Standard_D4s_v3', 'region': 'eastus', 'status': 'running', 'cpu': 4, 'memory': 16, 'ip': '20.84.32.156'},
                {'name': 'sql-server-vm', 'type': 'Standard_E8s_v3', 'region': 'eastus', 'status': 'running', 'cpu': 8, 'memory': 64, 'ip': '20.84.33.201'},
                {'name': 'devops-agent-1', 'type': 'Standard_B2ms', 'region': 'westeurope', 'status': 'running', 'cpu': 2, 'memory': 8, 'ip': '20.71.45.89'},
                {'name': 'test-environment', 'type': 'Standard_D2s_v3', 'region': 'westus2', 'status': 'stopped', 'cpu': 2, 'memory': 8, 'ip': '—'},
                {'name': 'k8s-node-1', 'type': 'Standard_D8s_v3', 'region': 'eastus', 'status': 'running', 'cpu': 8, 'memory': 32, 'ip': '20.84.34.78'},
            ],
            'gcp': [
                {'name': 'frontend-prod', 'type': 'e2-standard-4', 'region': 'us-central1', 'status': 'running', 'cpu': 4, 'memory': 16, 'ip': '35.224.128.45'},
                {'name': 'backend-api', 'type': 'n2-standard-8', 'region': 'us-central1', 'status': 'running', 'cpu': 8, 'memory': 32, 'ip': '35.192.67.89'},
                {'name': 'data-pipeline', 'type': 'n2-highmem-4', 'region': 'us-east4', 'status': 'running', 'cpu': 4, 'memory': 32, 'ip': '35.245.112.34'},
                {'name': 'gpu-inference', 'type': 'a2-highgpu-1g', 'region': 'us-central1', 'status': 'stopped', 'cpu': 12, 'memory': 85, 'ip': '—'},
                {'name': 'dev-sandbox', 'type': 'e2-medium', 'region': 'europe-west1', 'status': 'running', 'cpu': 2, 'memory': 4, 'ip': '34.76.128.92'},
            ],
        }

        vms = []
        for i, cfg in enumerate(vm_configs.get(self.provider, [])):
            vms.append({
                'id': f'{self.provider}-vm-{i+1:03d}',
                'name': cfg['name'],
                'provider': self.provider,
                'instance_type': cfg['type'],
                'region': cfg['region'],
                'status': cfg['status'],
                'cpu_cores': cfg['cpu'],
                'memory_gb': cfg['memory'],
                'public_ip': cfg['ip'],
                'os': random.choice(['Ubuntu 22.04 LTS', 'Amazon Linux 2023', 'Windows Server 2022', 'Debian 12', 'RHEL 9']),
                'disk_gb': random.choice([50, 100, 200, 500, 1000]),
                'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(30, 365))).isoformat(),
                'monthly_cost': round(random.uniform(20, 800), 2),
                'tags': {'environment': random.choice(['production', 'staging', 'development']), 'team': random.choice(['platform', 'data', 'frontend', 'backend'])},
            })
        return vms

    def list_vms(self):
        return self._vms

    def get_vm(self, vm_id):
        for vm in self._vms:
            if vm['id'] == vm_id:
                return vm
        return None

    def start_vm(self, vm_id):
        for vm in self._vms:
            if vm['id'] == vm_id:
                vm['status'] = 'running'
                return True
        return False

    def stop_vm(self, vm_id):
        for vm in self._vms:
            if vm['id'] == vm_id:
                vm['status'] = 'stopped'
                return True
        return False

    def create_vm(self, config):
        new_id = f'{self.provider}-vm-{len(self._vms)+1:03d}'
        vm = {
            'id': new_id,
            'name': config.get('name', f'new-vm-{new_id}'),
            'provider': self.provider,
            'instance_type': config.get('instance_type', 't3.medium'),
            'region': config.get('region', 'us-east-1'),
            'status': 'running',
            'cpu_cores': config.get('cpu_cores', 2),
            'memory_gb': config.get('memory_gb', 4),
            'public_ip': f'{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}',
            'os': config.get('os', 'Ubuntu 22.04 LTS'),
            'disk_gb': config.get('disk_gb', 100),
            'created_at': datetime.now(timezone.utc).isoformat(),
            'monthly_cost': round(random.uniform(20, 200), 2),
            'tags': config.get('tags', {}),
        }
        self._vms.append(vm)
        return vm

    def delete_vm(self, vm_id):
        self._vms = [vm for vm in self._vms if vm['id'] != vm_id]
        return True

    # ── Storage Operations ─────────────────────────

    def _generate_storage(self):
        storage_configs = {
            'aws': [
                {'name': 'prod-assets-bucket', 'type': 'S3 Standard', 'region': 'us-east-1', 'size_gb': 2340, 'objects': 1847293},
                {'name': 'backup-vault', 'type': 'S3 Glacier', 'region': 'us-east-1', 'size_gb': 15680, 'objects': 45231},
                {'name': 'log-archive', 'type': 'S3 Standard-IA', 'region': 'us-west-2', 'size_gb': 890, 'objects': 234876},
                {'name': 'ml-datasets', 'type': 'S3 Standard', 'region': 'us-west-2', 'size_gb': 5200, 'objects': 12450},
            ],
            'azure': [
                {'name': 'prodmediastore', 'type': 'Blob Hot', 'region': 'eastus', 'size_gb': 1890, 'objects': 923451},
                {'name': 'archivestore', 'type': 'Blob Archive', 'region': 'eastus', 'size_gb': 8900, 'objects': 34521},
                {'name': 'devtestdata', 'type': 'Blob Cool', 'region': 'westeurope', 'size_gb': 340, 'objects': 67890},
            ],
            'gcp': [
                {'name': 'app-static-assets', 'type': 'Standard', 'region': 'us-central1', 'size_gb': 1200, 'objects': 567890},
                {'name': 'analytics-datalake', 'type': 'Nearline', 'region': 'us-central1', 'size_gb': 7800, 'objects': 234567},
                {'name': 'cold-backup', 'type': 'Coldline', 'region': 'us-east4', 'size_gb': 12400, 'objects': 89012},
            ],
        }

        buckets = []
        for i, cfg in enumerate(storage_configs.get(self.provider, [])):
            buckets.append({
                'id': f'{self.provider}-store-{i+1:03d}',
                'name': cfg['name'],
                'provider': self.provider,
                'storage_class': cfg['type'],
                'region': cfg['region'],
                'size_gb': cfg['size_gb'],
                'object_count': cfg['objects'],
                'monthly_cost': round(cfg['size_gb'] * random.uniform(0.02, 0.08), 2),
                'created_at': (datetime.now(timezone.utc) - timedelta(days=random.randint(60, 500))).isoformat(),
                'encryption': random.choice(['AES-256', 'SSE-KMS', 'CMEK']),
                'versioning': random.choice([True, False]),
                'public_access': False,
            })
        return buckets

    def list_storage(self):
        return self._storage

    def get_storage(self, storage_id):
        for s in self._storage:
            if s['id'] == storage_id:
                return s
        return None

    def create_storage(self, config):
        new_id = f'{self.provider}-store-{len(self._storage)+1:03d}'
        bucket = {
            'id': new_id,
            'name': config.get('name', f'new-bucket-{new_id}'),
            'provider': self.provider,
            'storage_class': config.get('storage_class', 'Standard'),
            'region': config.get('region', 'us-east-1'),
            'size_gb': 0,
            'object_count': 0,
            'monthly_cost': 0,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'encryption': config.get('encryption', 'AES-256'),
            'versioning': config.get('versioning', False),
            'public_access': False,
        }
        self._storage.append(bucket)
        return bucket

    def delete_storage(self, storage_id):
        self._storage = [s for s in self._storage if s['id'] != storage_id]
        return True

    # ── Billing Operations ─────────────────────────

    def get_billing_summary(self, start_date, end_date):
        base_costs = {'aws': 12450, 'azure': 8920, 'gcp': 6780}
        base = base_costs.get(self.provider, 5000)
        return {
            'provider': self.provider,
            'period': {'start': start_date, 'end': end_date},
            'total_cost': round(base + random.uniform(-500, 500), 2),
            'previous_period_cost': round(base * 0.95, 2),
            'change_percent': round(random.uniform(-8, 12), 1),
            'currency': 'USD',
            'top_services': self._get_top_services(),
        }

    def _get_top_services(self):
        services = {
            'aws': [
                {'name': 'EC2', 'cost': round(random.uniform(3000, 5000), 2)},
                {'name': 'RDS', 'cost': round(random.uniform(2000, 3500), 2)},
                {'name': 'S3', 'cost': round(random.uniform(800, 1500), 2)},
                {'name': 'Lambda', 'cost': round(random.uniform(200, 800), 2)},
                {'name': 'CloudFront', 'cost': round(random.uniform(300, 700), 2)},
            ],
            'azure': [
                {'name': 'Virtual Machines', 'cost': round(random.uniform(2500, 4000), 2)},
                {'name': 'SQL Database', 'cost': round(random.uniform(1500, 2500), 2)},
                {'name': 'Blob Storage', 'cost': round(random.uniform(600, 1200), 2)},
                {'name': 'App Service', 'cost': round(random.uniform(400, 900), 2)},
                {'name': 'Functions', 'cost': round(random.uniform(100, 400), 2)},
            ],
            'gcp': [
                {'name': 'Compute Engine', 'cost': round(random.uniform(2000, 3500), 2)},
                {'name': 'BigQuery', 'cost': round(random.uniform(1000, 2000), 2)},
                {'name': 'Cloud Storage', 'cost': round(random.uniform(500, 1000), 2)},
                {'name': 'Cloud Run', 'cost': round(random.uniform(200, 600), 2)},
                {'name': 'Cloud SQL', 'cost': round(random.uniform(800, 1500), 2)},
            ],
        }
        return services.get(self.provider, [])

    def get_billing_daily(self, start_date, end_date):
        days = []
        current = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        base_daily = {'aws': 415, 'azure': 297, 'gcp': 226}.get(self.provider, 200)

        while current <= end:
            # Add some realistic fluctuation with weekly patterns
            day_of_week = current.weekday()
            weekend_factor = 0.7 if day_of_week >= 5 else 1.0
            cost = base_daily * weekend_factor * random.uniform(0.85, 1.15)
            days.append({
                'date': current.strftime('%Y-%m-%d'),
                'cost': round(cost, 2),
            })
            current += timedelta(days=1)
        return {'provider': self.provider, 'daily_costs': days}

    def get_billing_by_service(self, start_date, end_date):
        return {
            'provider': self.provider,
            'period': {'start': start_date, 'end': end_date},
            'services': self._get_top_services(),
        }

    # ── Monitoring Operations ──────────────────────

    def get_metrics(self, resource_id, metric_type, period):
        """Generate realistic metric data points."""
        now = datetime.now(timezone.utc)
        points = []
        num_points = {'1h': 60, '6h': 72, '24h': 96, '7d': 168}.get(period, 60)
        interval = {'1h': 1, '6h': 5, '24h': 15, '7d': 60}.get(period, 1)

        for i in range(num_points):
            timestamp = now - timedelta(minutes=interval * (num_points - i))
            if metric_type == 'cpu':
                # Simulate CPU with daily pattern
                hour_factor = 0.3 + 0.5 * math.sin((timestamp.hour - 6) * math.pi / 12)
                value = max(5, min(95, hour_factor * 60 + random.gauss(0, 8)))
            elif metric_type == 'memory':
                value = max(20, min(95, 65 + random.gauss(0, 5)))
            elif metric_type == 'disk':
                value = max(10, min(90, 45 + i * 0.02 + random.gauss(0, 2)))
            elif metric_type == 'network_in':
                value = max(0, random.gauss(150, 50))  # Mbps
            elif metric_type == 'network_out':
                value = max(0, random.gauss(80, 30))  # Mbps
            else:
                value = random.uniform(0, 100)

            points.append({
                'timestamp': timestamp.isoformat(),
                'value': round(value, 2),
            })

        return {
            'resource_id': resource_id,
            'metric_type': metric_type,
            'period': period,
            'unit': {'cpu': '%', 'memory': '%', 'disk': '%', 'network_in': 'Mbps', 'network_out': 'Mbps'}.get(metric_type, '%'),
            'data_points': points,
        }

    def get_health_status(self):
        statuses = []
        for vm in self._vms:
            if vm['status'] == 'stopped':
                health = 'stopped'
            else:
                health = random.choices(['healthy', 'warning', 'critical'], weights=[85, 12, 3])[0]
            statuses.append({
                'resource_id': vm['id'],
                'resource_name': vm['name'],
                'resource_type': 'vm',
                'provider': self.provider,
                'health': health,
                'cpu_usage': round(random.uniform(5, 85), 1) if vm['status'] == 'running' else 0,
                'memory_usage': round(random.uniform(20, 90), 1) if vm['status'] == 'running' else 0,
                'disk_usage': round(random.uniform(15, 75), 1),
                'uptime_hours': random.randint(1, 8760) if vm['status'] == 'running' else 0,
                'last_checked': datetime.now(timezone.utc).isoformat(),
            })
        return statuses
