from flask import Blueprint, request, jsonify
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from bson import ObjectId
import datetime

inventory_bp = Blueprint("inventory", __name__)

def parse_medicine_data(data):
    """Utility to clean and parse input data for medicines."""
    try:
        quantity = int(data.get("quantity", 0))
        monthly_sales = int(data.get("monthly_sales", 0))
        purchase_price = float(data.get("purchase_price", 0.0))
        selling_price = float(data.get("selling_price", 0.0))
    except (ValueError, TypeError):
        raise ValueError("Invalid numeric values for quantity, monthly_sales, or prices.")

    return {
        "medicine_name": str(data.get("medicine_name", "")).strip(),
        "generic_name": str(data.get("generic_name", "")).strip(),
        "category": str(data.get("category", "General")).strip(),
        "batch_number": str(data.get("batch_number", "")).strip().upper(),
        "supplier": str(data.get("supplier", "")).strip(),
        "manufacturing_date": str(data.get("manufacturing_date", "")).strip(),
        "expiry_date": str(data.get("expiry_date", "")).strip(),
        "quantity": quantity,
        "monthly_sales": monthly_sales,
        "purchase_price": purchase_price,
        "selling_price": selling_price,
    }

@inventory_bp.route("", methods=["GET"])
@token_required
def get_inventory(current_user):
    search_query = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip()
    
    # Building query filter
    query = {}
    if search_query:
        query["$or"] = [
            {"medicine_name": {"$regex": search_query, "$options": "i"}},
            {"generic_name": {"$regex": search_query, "$options": "i"}}
        ]
    if category:
        query["category"] = category

    # Fetch inventory from DB
    try:
        items = db.inventory.find(query)
    except Exception as e:
        items = db.inventory.find({})

    # Format output items
    output = []
    for item in items:
        item["_id"] = str(item["_id"])
        output.append(item)
        
    return jsonify(output), 200

@inventory_bp.route("", methods=["POST"])
@token_required
def add_medicine(current_user):
    data = request.get_json() or {}
    try:
        parsed_data = parse_medicine_data(data)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    if not parsed_data["medicine_name"]:
        return jsonify({"message": "Medicine Name is required."}), 400
        
    # Check if duplicate batch number exists
    if parsed_data["batch_number"]:
        existing = db.inventory.find_one({"batch_number": parsed_data["batch_number"]})
        if existing:
            return jsonify({"message": f"Medicine with batch number {parsed_data['batch_number']} already exists."}), 409

    result = db.inventory.insert_one(parsed_data)
    parsed_data["_id"] = str(result.inserted_id)
    
    return jsonify({
        "message": "Medicine added successfully!",
        "medicine": parsed_data
    }), 201

@inventory_bp.route("/<string:id>", methods=["PUT"])
@token_required
def update_medicine(current_user, id):
    data = request.get_json() or {}
    try:
        parsed_data = parse_medicine_data(data)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    # Locate medicine
    oid = ObjectId(id) if ObjectId.is_valid(id) else id
    existing = db.inventory.find_one({"_id": oid})
    if not existing:
        return jsonify({"message": "Medicine not found."}), 404

    # Perform update
    db.inventory.update_one({"_id": oid}, {"$set": parsed_data})
    parsed_data["_id"] = str(id)

    return jsonify({
        "message": "Medicine updated successfully!",
        "medicine": parsed_data
    }), 200

@inventory_bp.route("/<string:id>", methods=["DELETE"])
@token_required
def delete_medicine(current_user, id):
    oid = ObjectId(id) if ObjectId.is_valid(id) else id
    existing = db.inventory.find_one({"_id": oid})
    if not existing:
        return jsonify({"message": "Medicine not found."}), 404

    db.inventory.delete_one({"_id": oid})
    return jsonify({"message": "Medicine deleted successfully!"}), 200
