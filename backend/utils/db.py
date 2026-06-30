import os
import json
import logging
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from backend.config import Config

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("db_connector")

# Mock database file path
MOCK_DB_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "mock_db.json")

class MockCollection:
    def __init__(self, db_client, collection_name):
        self.db_client = db_client
        self.collection_name = collection_name

    def _read_data(self):
        if not os.path.exists(MOCK_DB_FILE):
            return {}
        try:
            with open(MOCK_DB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_data(self, data):
        try:
            with open(MOCK_DB_FILE, "w") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            logger.error(f"Error writing mock DB: {e}")

    def _match(self, doc, query):
        if not query:
            return True
        for key, value in query.items():
            if key == "$or":
                # Handle $or condition
                or_matched = False
                for sub_query in value:
                    if self._match(doc, sub_query):
                        or_matched = True
                        break
                if not or_matched:
                    return False
                continue
            if key == "_id" and isinstance(value, (dict, ObjectId)):
                # Handle ID comparison
                doc_id = doc.get("_id")
                if isinstance(value, dict) and "$in" in value:
                    ids = [str(x) for x in value["$in"]]
                    if str(doc_id) not in ids:
                        return False
                elif str(doc_id) != str(value):
                    return False
                continue
            if key not in doc:
                return False
            # Check for range queries e.g. {"$lt": val}
            if isinstance(value, dict):
                for op, val in value.items():
                    if op == "$lt" and not (doc[key] < val):
                        return False
                    elif op == "$lte" and not (doc[key] <= val):
                        return False
                    elif op == "$gt" and not (doc[key] > val):
                        return False
                    elif op == "$gte" and not (doc[key] >= val):
                        return False
                    elif op == "$ne" and not (doc[key] != val):
                        return False
                    elif op == "$regex":
                        # Handle regex search
                        options = value.get("$options", "")
                        flags = 0
                        if "i" in options:
                            flags |= 2  # re.IGNORECASE
                        import re
                        if not re.search(val, str(doc[key]), flags):
                            return False
            elif doc[key] != value:
                return False
        return True

    def find(self, query=None):
        query = query or {}
        db_data = self._read_data()
        docs = db_data.get(self.collection_name, [])
        matched = []
        for doc in docs:
            if self._match(doc, query):
                # Ensure _id is an ObjectId or acts like one
                doc_copy = doc.copy()
                doc_copy["_id"] = ObjectId(doc["_id"]) if isinstance(doc["_id"], str) else doc["_id"]
                matched.append(doc_copy)
        return matched

    def find_one(self, query):
        results = self.find(query)
        return results[0] if results else None

    def insert_one(self, document):
        db_data = self._read_data()
        if self.collection_name not in db_data:
            db_data[self.collection_name] = []
        
        # Auto-generate ID if not present
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        elif isinstance(document["_id"], ObjectId):
            document["_id"] = str(document["_id"])

        db_data[self.collection_name].append(document)
        self._write_data(db_data)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(ObjectId(document["_id"]))

    def update_one(self, query, update_doc):
        db_data = self._read_data()
        docs = db_data.get(self.collection_name, [])
        modified_count = 0
        
        for doc in docs:
            if self._match(doc, query):
                # Update document fields
                if "$set" in update_doc:
                    for k, v in update_doc["$set"].items():
                        if isinstance(v, ObjectId):
                            doc[k] = str(v)
                        else:
                            doc[k] = v
                else:
                    for k, v in update_doc.items():
                        if isinstance(v, ObjectId):
                            doc[k] = str(v)
                        else:
                            doc[k] = v
                modified_count = 1
                break
                
        if modified_count > 0:
            db_data[self.collection_name] = docs
            self._write_data(db_data)

        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(modified_count)

    def delete_one(self, query):
        db_data = self._read_data()
        docs = db_data.get(self.collection_name, [])
        deleted_count = 0
        
        for idx, doc in enumerate(docs):
            if self._match(doc, query):
                docs.pop(idx)
                deleted_count = 1
                break
                
        if deleted_count > 0:
            db_data[self.collection_name] = docs
            self._write_data(db_data)

        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    def count_documents(self, query):
        return len(self.find(query))


class MockDatabase:
    def __init__(self):
        logger.info("Initializing fallback MockDatabase (file-based).")
        self.users = MockCollection(self, "users")
        self.inventory = MockCollection(self, "inventory")
        self.forecasts = MockCollection(self, "forecasts")

def get_db():
    if not Config.MONGO_URI:
        logger.warning("MONGO_URI not set. Using MockDatabase fallback.")
        return MockDatabase()
    
    try:
        # Establish connection with a 3-second timeout
        client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas!")
        # Use database from URI or default to carewise
        db_name = Config.MONGO_URI.split('/')[-1].split('?')[0]
        if not db_name:
            db_name = "carewise"
        return client[db_name]
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        logger.error(f"Failed to connect to MongoDB: {e}. Falling back to MockDatabase.")
        return MockDatabase()

# Singleton DB instance
db = get_db()
