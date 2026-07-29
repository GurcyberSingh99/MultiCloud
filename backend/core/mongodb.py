"""
MongoDB connection manager using PyMongo with automatic in-memory fallback.
If a live MongoDB instance is not detected, it falls back to an in-memory
collection emulator so the app functions out-of-the-box without requiring MongoDB installed.
"""

from pymongo import MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError, ConnectionFailure
from django.conf import settings
from bson import ObjectId
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# In-Memory Collection Emulator
# ──────────────────────────────────────────────
class InMemoryCursor:
    """Emulates a PyMongo cursor."""
    def __init__(self, documents):
        self._docs = list(documents)

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, list):
            key, direction = key_or_list[0]
        else:
            key = key_or_list
        reverse = (direction == -1)
        self._docs.sort(key=lambda d: d.get(key, ''), reverse=reverse)
        return self

    def skip(self, n):
        self._docs = self._docs[n:]
        return self

    def limit(self, n):
        self._docs = self._docs[:n]
        return self

    def __iter__(self):
        return iter(self._docs)

    def __len__(self):
        return len(self._docs)


class InsertOneResult:
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id


class InMemoryCollection:
    """In-memory collection fallback mimicking PyMongo collection API."""
    _store = {}

    def __init__(self, name):
        self.name = name
        if name not in InMemoryCollection._store:
            InMemoryCollection._store[name] = []

    @property
    def _docs(self):
        return InMemoryCollection._store[self.name]

    def _matches(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            if key == '_id':
                if str(doc.get('_id')) != str(val):
                    return False
            elif doc.get(key) != val:
                return False
        return True

    def find_one(self, query=None):
        query = query or {}
        for doc in self._docs:
            if self._matches(doc, query):
                # Return a copy to avoid accidental mutation
                return dict(doc)
        return None

    def insert_one(self, doc):
        doc_copy = dict(doc)
        if '_id' not in doc_copy:
            doc_copy['_id'] = ObjectId()
        self._docs.append(doc_copy)
        return InsertOneResult(doc_copy['_id'])

    def update_one(self, query, update):
        for doc in self._docs:
            if self._matches(doc, query):
                if '$set' in update:
                    for k, v in update['$set'].items():
                        doc[k] = v
                return True
        return False

    def count_documents(self, query=None):
        query = query or {}
        return sum(1 for doc in self._docs if self._matches(doc, query))

    def find(self, query=None, projection=None):
        query = query or {}
        matched = [dict(doc) for doc in self._docs if self._matches(doc, query)]
        return InMemoryCursor(matched)


# ──────────────────────────────────────────────
# MongoDB Singleton Connection Manager
# ──────────────────────────────────────────────
class MongoDB:
    """Singleton MongoDB connection manager with automatic fallback."""
    _client = None
    _db = None
    _use_fallback = False

    @classmethod
    def _init_connection(cls):
        if cls._client is not None or cls._use_fallback:
            return

        try:
            client = MongoClient(
                settings.MONGODB_URI,
                maxPoolSize=50,
                minPoolSize=5,
                serverSelectionTimeoutMS=1500,  # Fast failover if MongoDB isn't running
            )
            # Test server connection
            client.admin.command('ping')
            cls._client = client
            cls._db = client[settings.MONGODB_NAME]
            logger.info("Connected to MongoDB successfully.")
        except Exception as e:
            logger.warning(f"MongoDB connection failed ({e}). Falling back to In-Memory Database.")
            cls._use_fallback = True

    @classmethod
    def get_collection(cls, name):
        cls._init_connection()
        if cls._use_fallback or cls._db is None:
            return InMemoryCollection(name)
        try:
            return cls._db[name]
        except Exception:
            return InMemoryCollection(name)


def get_db():
    MongoDB._init_connection()
    return MongoDB._db


def get_collection(name):
    return MongoDB.get_collection(name)
