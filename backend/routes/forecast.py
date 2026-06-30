from flask import Blueprint, request, jsonify
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from backend.models.forecast_model import DemandForecaster
from bson import ObjectId

forecast_bp = Blueprint("forecast", __name__)

@forecast_bp.route("", methods=["POST"])
@token_required
def get_forecast(current_user):
    data = request.get_json() or {}
    medicine_id = data.get("medicine_id")
    
    if not medicine_id:
        return jsonify({"message": "medicine_id is required."}), 400
        
    oid = ObjectId(medicine_id) if ObjectId.is_valid(medicine_id) else medicine_id
    med = db.inventory.find_one({"_id": oid})
    if not med:
        return jsonify({"message": "Medicine not found in inventory."}), 404
        
    forecast_data = DemandForecaster.forecast_demand(med, num_months=4)
    
    return jsonify({
        "medicine_id": str(med["_id"]),
        "medicine_name": med.get("medicine_name"),
        "category": med.get("category"),
        "monthly_sales": med.get("monthly_sales"),
        "current_stock": med.get("quantity"),
        "forecast_data": forecast_data
    }), 200
