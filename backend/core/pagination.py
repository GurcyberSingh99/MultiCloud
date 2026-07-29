"""
Custom pagination for MongoDB-backed API views.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class CustomPagination(PageNumberPagination):
    """
    Custom pagination that works with both Django ORM and raw MongoDB queries.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
        })


def paginate_mongo_query(request, collection, query=None, sort=None, projection=None):
    """
    Paginate a MongoDB query manually.

    Args:
        request: DRF request object
        collection: PyMongo collection
        query: MongoDB filter dict
        sort: list of (field, direction) tuples
        projection: fields to include/exclude

    Returns:
        dict with count, next, previous, results
    """
    if query is None:
        query = {}

    page = int(request.query_params.get('page', 1))
    page_size = min(int(request.query_params.get('page_size', 20)), 100)
    skip = (page - 1) * page_size

    total_count = collection.count_documents(query)

    cursor = collection.find(query, projection)
    if sort:
        cursor = cursor.sort(sort)
    cursor = cursor.skip(skip).limit(page_size)

    results = []
    for doc in cursor:
        doc['id'] = str(doc.pop('_id'))
        results.append(doc)

    total_pages = (total_count + page_size - 1) // page_size
    base_url = request.build_absolute_uri().split('?')[0]

    return {
        'count': total_count,
        'total_pages': total_pages,
        'current_page': page,
        'page_size': page_size,
        'next': f'{base_url}?page={page + 1}&page_size={page_size}' if page < total_pages else None,
        'previous': f'{base_url}?page={page - 1}&page_size={page_size}' if page > 1 else None,
        'results': results,
    }
