"""
Virtual Machines API views.
Aggregates VM data from all cloud providers.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.cloud_providers.registry import get_adapter, get_all_adapters


class VMListView(APIView):
    """List VMs across all or a specific cloud provider."""

    def get(self, request):
        provider = request.query_params.get('provider')
        search = request.query_params.get('search', '').lower()
        status_filter = request.query_params.get('status')

        all_vms = []
        if provider:
            adapter = get_adapter(provider)
            all_vms = adapter.list_vms()
        else:
            for name, adapter in get_all_adapters().items():
                all_vms.extend(adapter.list_vms())

        # Apply filters
        if search:
            all_vms = [vm for vm in all_vms if search in vm['name'].lower() or search in vm.get('instance_type', '').lower()]
        if status_filter:
            all_vms = [vm for vm in all_vms if vm['status'] == status_filter]

        return Response({
            'success': True,
            'data': {
                'count': len(all_vms),
                'vms': all_vms,
            },
        })

    def post(self, request):
        """Create a new VM."""
        provider = request.data.get('provider', 'aws')
        adapter = get_adapter(provider)
        vm = adapter.create_vm(request.data)
        return Response({
            'success': True,
            'data': vm,
        }, status=status.HTTP_201_CREATED)


class VMDetailView(APIView):
    """Get, update, or delete a specific VM."""

    def get(self, request, vm_id):
        provider = request.query_params.get('provider')
        if provider:
            adapter = get_adapter(provider)
            vm = adapter.get_vm(vm_id)
        else:
            vm = None
            for name, adapter in get_all_adapters().items():
                vm = adapter.get_vm(vm_id)
                if vm:
                    break

        if not vm:
            return Response(
                {'success': False, 'error': 'VM not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({'success': True, 'data': vm})

    def delete(self, request, vm_id):
        provider = request.query_params.get('provider')
        if provider:
            adapter = get_adapter(provider)
            adapter.delete_vm(vm_id)
        else:
            for name, adapter in get_all_adapters().items():
                adapter.delete_vm(vm_id)

        return Response({'success': True, 'message': 'VM deleted.'})


class VMActionView(APIView):
    """Perform actions (start/stop) on a VM."""

    def post(self, request, vm_id):
        action = request.data.get('action')
        if action not in ('start', 'stop'):
            return Response(
                {'success': False, 'error': 'Action must be "start" or "stop".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        provider = request.data.get('provider')
        success_flag = False
        if provider:
            adapter = get_adapter(provider)
            if action == 'start':
                success_flag = adapter.start_vm(vm_id)
            else:
                success_flag = adapter.stop_vm(vm_id)
        else:
            for name, adapter in get_all_adapters().items():
                if action == 'start':
                    result = adapter.start_vm(vm_id)
                else:
                    result = adapter.stop_vm(vm_id)
                if result:
                    success_flag = True
                    break

        if success_flag:
            return Response({'success': True, 'message': f'VM {action}ed successfully.'})
        return Response(
            {'success': False, 'error': 'VM not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
