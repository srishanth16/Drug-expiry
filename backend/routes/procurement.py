from flask import Blueprint, request, jsonify
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from backend.models.forecast_model import DemandForecaster
import math

procurement_bp = Blueprint("procurement", __name__)

@procurement_bp.route("", methods=["GET", "POST"])
@token_required
def get_procurement_recommendations(current_user):
    """Generates optimal restock suggestions based on Lead Time, Safety Stock, and Forecasted Demand."""
    data = request.get_json() or {} if request.method == "POST" else {}
    
    # Custom values if provided by the user, else default
    lead_time_days = int(data.get("lead_time_days", 7)) # default 7 days
    safety_stock_days = int(data.get("safety_stock_days", 5)) # default 5 days buffer
    
    medicines = list(db.inventory.find({}))
    recommendations = []
    
    for med in medicines:
        qty = med.get("quantity", 0)
        monthly_sales = max(med.get("monthly_sales", 0), 1)
        purchase_price = med.get("purchase_price", 0.0)
        
        # Calculate daily sales rate
        daily_sales = monthly_sales / 30.0
        
        # 1. Expected Demand during lead time
        expected_lead_demand = daily_sales * lead_time_days
        
        # 2. Safety Stock calculation
        safety_stock = daily_sales * safety_stock_days
        
        # 3. Reorder Point (ROP)
        reorder_point = math.ceil(expected_lead_demand + safety_stock)
        
        # Check if reorder is needed
        reorder_needed = qty <= reorder_point
        
        # 4. Recommended order quantity
        # Order enough to cover next 30 days of sales plus safety stock, minus current quantity
        if reorder_needed:
            recommended_order = math.ceil((daily_sales * 30) + safety_stock - qty)
            # Round to nearest multiple of 10 for standard package orders
            recommended_order = max(math.ceil(recommended_order / 10.0) * 10, 10)
        else:
            recommended_order = 0
            
        estimated_cost = round(recommended_order * purchase_price, 2)
        
        recommendations.append({
            "id": str(med["_id"]),
            "medicine_name": med.get("medicine_name"),
            "category": med.get("category"),
            "current_stock": qty,
            "monthly_sales": monthly_sales,
            "reorder_point": reorder_point,
            "reorder_needed": reorder_needed,
            "recommended_order": recommended_order,
            "purchase_price": purchase_price,
            "estimated_cost": estimated_cost,
            "supplier": med.get("supplier", "General Supplier")
        })
        
    # Sort recommendations: reorder needed first, then by estimated cost descending
    recommendations.sort(key=lambda x: (not x["reorder_needed"], -x["estimated_cost"]))
    
    return jsonify(recommendations), 200
