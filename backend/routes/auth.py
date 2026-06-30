from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from backend.config import Config
from backend.utils.db import db
from backend.utils.auth_middleware import token_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "Pharmacist")  # Defaults to Pharmacist
    
    if not name or not email or not password:
        return jsonify({"message": "Please provide name, email, and password."}), 400
        
    if role not in ["Admin", "Pharmacist"]:
        return jsonify({"message": "Invalid role. Must be Admin or Pharmacist."}), 400
        
    # Check if user already exists
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"message": "User already exists with this email."}), 409
        
    # Create user document
    password_hash = generate_password_hash(password)
    user_doc = {
        "name": name,
        "email": email,
        "password_hash": password_hash,
        "role": role
    }
    
    db.users.insert_one(user_doc)
    return jsonify({"message": "User registered successfully!"}), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Please provide email and password."}), 400
        
    user = db.users.find_one({"email": email})
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid email or password."}), 401
        
    # Generate JWT token
    token = jwt.encode(
        {
            "user_id": str(user["_id"]),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )
    
    return jsonify({
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me(current_user):
    return jsonify({
        "user": current_user
    }), 200
