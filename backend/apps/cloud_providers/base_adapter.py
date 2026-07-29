"""
Abstract base class for cloud provider adapters.
All cloud adapters (AWS, Azure, GCP, Mock) implement this interface.
"""

from abc import ABC, abstractmethod


class CloudAdapter(ABC):
    """
    Unified interface for multi-cloud operations.
    Each provider implements these methods, returning normalized data schemas.
    """

    # ── VM Operations ──────────────────────────────
    @abstractmethod
    def list_vms(self):
        """List all virtual machines. Returns list of VM dicts."""
        pass

    @abstractmethod
    def get_vm(self, vm_id):
        """Get details of a specific VM."""
        pass

    @abstractmethod
    def start_vm(self, vm_id):
        """Start a stopped VM."""
        pass

    @abstractmethod
    def stop_vm(self, vm_id):
        """Stop a running VM."""
        pass

    @abstractmethod
    def create_vm(self, config):
        """Create a new VM with given configuration."""
        pass

    @abstractmethod
    def delete_vm(self, vm_id):
        """Delete/terminate a VM."""
        pass

    # ── Storage Operations ─────────────────────────
    @abstractmethod
    def list_storage(self):
        """List all storage buckets/containers."""
        pass

    @abstractmethod
    def get_storage(self, storage_id):
        """Get details of a storage bucket."""
        pass

    @abstractmethod
    def create_storage(self, config):
        """Create a new storage bucket."""
        pass

    @abstractmethod
    def delete_storage(self, storage_id):
        """Delete a storage bucket."""
        pass

    # ── Billing Operations ─────────────────────────
    @abstractmethod
    def get_billing_summary(self, start_date, end_date):
        """Get billing summary for a date range."""
        pass

    @abstractmethod
    def get_billing_daily(self, start_date, end_date):
        """Get daily cost breakdown."""
        pass

    @abstractmethod
    def get_billing_by_service(self, start_date, end_date):
        """Get costs broken down by service."""
        pass

    # ── Monitoring Operations ──────────────────────
    @abstractmethod
    def get_metrics(self, resource_id, metric_type, period):
        """Get metrics for a specific resource."""
        pass

    @abstractmethod
    def get_health_status(self):
        """Get health status of all resources."""
        pass
