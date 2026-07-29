"""Storage API views."""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.cloud_providers.registry import get_adapter, get_all_adapters


class StorageListView(APIView):
    """List storage buckets across all or a specific provider."""

    def get(self, request):
        provider = request.query_params.get('provider')
        all_storage = []
        if provider:
            adapter = get_adapter(provider)
            all_storage = adapter.list_storage()
        else:
            for name, adapter in get_all_adapters().items():
                all_storage.extend(adapter.list_storage())

        return Response({
            'success': True,
            'data': {
                'count': len(all_storage),
                'buckets': all_storage,
            },
        })

    def post(self, request):
        provider = request.data.get('provider', 'aws')
        adapter = get_adapter(provider)
        bucket = adapter.create_storage(request.data)
        return Response({'success': True, 'data': bucket}, status=status.HTTP_201_CREATED)


class StorageDetailView(APIView):
    """Get or delete a specific storage bucket."""

    def get(self, request, storage_id):
        for name, adapter in get_all_adapters().items():
            bucket = adapter.get_storage(storage_id)
            if bucket:
                return Response({'success': True, 'data': bucket})
        return Response({'success': False, 'error': 'Bucket not found.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, storage_id):
        for name, adapter in get_all_adapters().items():
            adapter.delete_storage(storage_id)
        return Response({'success': True, 'message': 'Bucket deleted.'})


class StorageStatsView(APIView):
    """Get storage usage statistics across all providers."""

    def get(self, request):
        stats = []
        for provider_name, adapter in get_all_adapters().items():
            buckets = adapter.list_storage()
            total_size = sum(b['size_gb'] for b in buckets)
            total_objects = sum(b['object_count'] for b in buckets)
            total_cost = sum(b['monthly_cost'] for b in buckets)
            stats.append({
                'provider': provider_name,
                'bucket_count': len(buckets),
                'total_size_gb': total_size,
                'total_objects': total_objects,
                'monthly_cost': round(total_cost, 2),
            })
        return Response({'success': True, 'data': stats})
