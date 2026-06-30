from flask import Blueprint, jsonify
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from backend.models.ml_models import risk_model
from backend.models.forecast_model import DemandForecaster
import datetime

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("", methods=["GET"])
@token_required
def get_dashboard_data(current_user):
    medicines = list(db.inventory.find({}))
    
    total_medicines = len(medicines)
    total_stock = sum(m.get("quantity", 0) for m in medicines)
    
    # Calculate risk profiles dynamically for each medicine
    high_risk_count = 0
    total_risk_score = 0
    projected_loss = 0.0
    potential_savings = 0.0
    upcoming_orders_count = 0
    
    risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    category_counts = {}
    expiry_months_data = {}
    
    # Today's date for reference
    today = datetime.datetime.now()
    
    # Aggregate monthly expiry trends for the next 6 months
    months_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for i in range(6):
        future_month = today + datetime.timedelta(days=i*30)
        key = f"{months_names[future_month.month - 1]} {future_month.year % 100}"
        expiry_months_data[key] = 0

    overall_forecast = {}
    for i in range(-3, 4):
        date_offset = today + datetime.timedelta(days=i*30)
        m_key = months_names[date_offset.month - 1]
        overall_forecast[m_key] = {"historical": 0, "forecast": 0}

    for m in medicines:
        qty = m.get("quantity", 0)
        sales = m.get("monthly_sales", 0)
        purchase_price = m.get("purchase_price", 0.0)
        selling_price = m.get("selling_price", 0.0)
        category = m.get("category", "General")
        expiry_str = m.get("expiry_date", "")

        # 1. Update Category counts
        category_counts[category] = category_counts.get(category, 0) + 1
        
        # 2. Expiry Risk Prediction using RF model
        pred = risk_model.predict_risk(qty, sales, expiry_str, category, selling_price)
        r_score = pred["risk_score"]
        r_level = pred["risk_level"]
        days_left = pred["days_left"]
        
        total_risk_score += r_score
        risk_counts[r_level] += 1
        
        if r_level in ["High", "Critical"]:
            high_risk_count += 1
            
        # 3. Projected Loss & Savings calculations
        if days_left <= 0:
            # Already expired, total loss is purchase value
            projected_loss += (purchase_price * qty)
        elif r_level == "Critical":
            # Highly likely to expire, projected loss of stock value
            projected_loss += (purchase_price * qty)
            # Potential savings if returned to supplier (e.g. 80% buyback or relocation)
            potential_savings += (purchase_price * qty * 0.8)
        elif r_level == "High":
            # Potential loss of sales, but savings if discounted early
            projected_loss += (purchase_price * qty * 0.5)
            potential_savings += (selling_price * qty * 0.6) # save 60% by discounting
            
        # 4. Reorder Point (Smart Procurement) calculation
        # Reorder Point = Expected Demand (Forecast) + Safety Stock
        # If stock is below Reorder Point, flag as upcoming order
        lead_time_days = 7  # Average lead time of 7 days
        daily_sales = sales / 30.0
        safety_stock = daily_sales * 5  # 5 days safety stock
        reorder_point = int((daily_sales * lead_time_days) + safety_stock)
        if qty <= reorder_point:
            upcoming_orders_count += 1
            
        # 5. Populate monthly expiry trend if it's within the next 6 months
        try:
            exp_date = datetime.datetime.strptime(expiry_str, "%Y-%m-%d")
            diff_days = (exp_date - today).days
            if 0 <= diff_days <= 180:
                key = f"{months_names[exp_date.month - 1]} {exp_date.year % 100}"
                if key in expiry_months_data:
                    expiry_months_data[key] += 1
        except Exception:
            pass

        # 6. Aggregate Demand Forecasting
        try:
            forecast_data = DemandForecaster.forecast_demand(m, num_months=3)
            for f in forecast_data:
                m_name = f["month"][:3]  # Use short name e.g. Jan
                if m_name in overall_forecast:
                    if f["historical"] is not None:
                        overall_forecast[m_name]["historical"] += f["historical"]
                    if f["forecast"] is not None:
                        overall_forecast[m_name]["forecast"] += f["forecast"]
        except Exception:
            pass

    # Format Monthly Expiry Chart data
    chart_expiry = [{"month": k, "count": v} for k, v in expiry_months_data.items()]
    
    # Format Category Chart data
    chart_category = [{"name": k, "value": v} for k, v in category_counts.items()]
    
    # Format Risk Chart data
    chart_risk = [{"name": k, "value": v} for k, v in risk_counts.items()]
    
    # Format Forecast Chart data
    chart_forecast = []
    for k, v in overall_forecast.items():
        chart_forecast.append({
            "month": k,
            "historical": v["historical"] if v["historical"] > 0 else None,
            "forecast": v["forecast"] if v["forecast"] > 0 else None
        })
    # Sort forecast chart based on month indices relative to today
    chart_forecast.sort(key=lambda x: months_names.index(x["month"]))

    avg_risk = round(total_risk_score / max(total_medicines, 1), 1)

    return jsonify({
        "metrics": {
            "total_medicines": total_medicines,
            "total_stock": total_stock,
            "average_risk_score": avg_risk,
            "high_risk_medicines": high_risk_count,
            "projected_loss": round(projected_loss, 2),
            "potential_savings": round(potential_savings, 2),
            "upcoming_orders": upcoming_orders_count
        },
        "charts": {
            "monthly_expiry_trend": chart_expiry,
            "category_distribution": chart_category,
            "risk_distribution": chart_risk,
            "forecast_trend": chart_forecast
        }
    }), 200
