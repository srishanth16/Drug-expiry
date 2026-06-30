from flask import Blueprint, request, jsonify
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from backend.utils.email import send_expiry_alert_email
from backend.models.ml_models import risk_model
from bson import ObjectId

risk_bp = Blueprint("risk", __name__)

@risk_bp.route("/predict", methods=["POST"])
@token_required
def predict_risk(current_user):
    data = request.get_json() or {}
    
    # Can predict either for a specific medicine in DB or for ad-hoc values
    medicine_id = data.get("medicine_id")
    if medicine_id:
        oid = ObjectId(medicine_id) if ObjectId.is_valid(medicine_id) else medicine_id
        med = db.inventory.find_one({"_id": oid})
        if not med:
            return jsonify({"message": "Medicine not found."}), 404
            
        qty = med.get("quantity", 0)
        sales = med.get("monthly_sales", 0)
        expiry_date = med.get("expiry_date", "")
        category = med.get("category", "General")
        price = med.get("selling_price", 0.0)
        name = med.get("medicine_name", "")
    else:
        qty = data.get("quantity")
        sales = data.get("monthly_sales")
        expiry_date = data.get("expiry_date")
        category = data.get("category", "General")
        price = data.get("selling_price", 0.0)
        name = data.get("medicine_name", "Test Item")

    if qty is None or sales is None or not expiry_date:
        return jsonify({"message": "Missing required fields: quantity, monthly_sales, and expiry_date are required."}), 400

    try:
        qty = int(qty)
        sales = int(sales)
        price = float(price)
    except (ValueError, TypeError):
        return jsonify({"message": "Invalid numeric format for quantity, monthly_sales or price."}), 400

    prediction = risk_model.predict_risk(qty, sales, expiry_date, category, price)
    
    return jsonify({
        "medicine_name": name,
        "quantity": qty,
        "monthly_sales": sales,
        "expiry_date": expiry_date,
        "category": category,
        "risk_score": prediction["risk_score"],
        "risk_level": prediction["risk_level"],
        "recommended_action": prediction["recommended_action"],
        "days_left": prediction["days_left"]
    }), 200

@risk_bp.route("/all", methods=["GET"])
@token_required
def predict_all_risks(current_user):
    """Calculates and returns risk profiles for all inventory items, sorted by highest risk first."""
    medicines = list(db.inventory.find({}))
    output = []
    
    for med in medicines:
        qty = med.get("quantity", 0)
        sales = med.get("monthly_sales", 0)
        expiry_date = med.get("expiry_date", "")
        category = med.get("category", "General")
        price = med.get("selling_price", 0.0)
        
        prediction = risk_model.predict_risk(qty, sales, expiry_date, category, price)
        
        output.append({
            "id": str(med["_id"]),
            "medicine_name": med.get("medicine_name"),
            "generic_name": med.get("generic_name"),
            "category": category,
            "quantity": qty,
            "monthly_sales": sales,
            "expiry_date": expiry_date,
            "risk_score": prediction["risk_score"],
            "risk_level": prediction["risk_level"],
            "recommended_action": prediction["recommended_action"],
            "days_left": prediction["days_left"]
        })
        
    # Sort by risk score descending
    output.sort(key=lambda x: x["risk_score"], reverse=True)
    return jsonify(output), 200

@risk_bp.route("/send-alerts", methods=["POST"])
@token_required
def send_expiry_alerts(current_user):
    """Sends email alerts for near-expiry (High/Critical risk) medicines."""
    medicines = list(db.inventory.find({}))
    high_risk_medicines = []
    
    for med in medicines:
        qty = med.get("quantity", 0)
        sales = med.get("monthly_sales", 0)
        expiry_date = med.get("expiry_date", "")
        category = med.get("category", "General")
        price = med.get("selling_price", 0.0)
        
        prediction = risk_model.predict_risk(qty, sales, expiry_date, category, price)
        
        if prediction["risk_level"] in ["High", "Critical"]:
            high_risk_medicines.append({
                "medicine_name": med.get("medicine_name"),
                "generic_name": med.get("generic_name"),
                "batch_number": med.get("batch_number"),
                "expiry_date": expiry_date,
                "quantity": qty
            })
    
    if not high_risk_medicines:
        return jsonify({
            "message": "No high-risk or critical medicines found. No alerts sent."
        }), 200
    
    try:
        send_expiry_alert_email(high_risk_medicines)
        return jsonify({
            "message": f"Successfully sent expiry alerts for {len(high_risk_medicines)} medicines!",
            "medicines": high_risk_medicines
        }), 200
    except ValueError as e:
        return jsonify({
            "message": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "message": f"Failed to send alerts: {str(e)}"
        }), 500
