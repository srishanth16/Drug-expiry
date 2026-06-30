import jwt
from functools import wraps
from flask import request, jsonify
from backend.config import Config
from backend.utils.db import db
from bson import ObjectId

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check for Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"message": "Token is missing!"}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            current_user = db.users.find_one({"_id": ObjectId(data["user_id"]) if ObjectId.is_valid(data["user_id"]) else data["user_id"]})
            if not current_user:
                return jsonify({"message": "Invalid token user!"}), 401
            
            # Format user representation for endpoints
            current_user["_id"] = str(current_user["_id"])
            if "password_hash" in current_user:
                del current_user["password_hash"]
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Token has expired!"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Token is invalid!"}), 401
        except Exception as e:
            return jsonify({"message": f"Authorization error: {str(e)}"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.get("role") not in allowed_roles:
                return jsonify({"message": "Access denied! Insufficient permissions."}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator
