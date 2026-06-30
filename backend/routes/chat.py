from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
from backend.models.ml_models import risk_model
import datetime
import logging

logger = logging.getLogger("chat_route")

chat_bp = Blueprint("chat", __name__)

# Try to import Gemini configuration (support both old and new packages)
genai = None
try:
    # Try new google.genai package first
    import google.genai as genai_lib
    genai = genai_lib
    logger.info("Using google.genai (new package) for Gemini chat")
except ImportError:
    try:
        # Fall back to deprecated google.generativeai
        import google.generativeai as genai_lib
        genai = genai_lib
        logger.info("Using google.generativeai (deprecated package) for Gemini chat")
    except Exception as e:
        logger.error(f"Failed to import Google Generative AI packages for chat: {e}")

def build_inventory_context():
    """Compiles a text-based dashboard and critical alerts summary to feed into Gemini's system prompt."""
    medicines = list(db.inventory.find({}))
    today = datetime.datetime.now()
    
    total_items = len(medicines)
    total_qty = sum(m.get("quantity", 0) for m in medicines)
    
    critical_expiries = []
    low_stock_items = []
    
    for m in medicines:
        name = m.get("medicine_name")
        qty = m.get("quantity", 0)
        sales = m.get("monthly_sales", 0)
        category = m.get("category", "General")
        expiry_str = m.get("expiry_date", "")
        
        # Risk assessment
        pred = risk_model.predict_risk(qty, sales, expiry_str, category, m.get("selling_price", 0.0))
        r_level = pred["risk_level"]
        r_score = pred["risk_score"]
        days_left = pred["days_left"]
        
        # Collect near expiries (days left < 120)
        if days_left <= 0:
            critical_expiries.append(f"- {name} (BATCH: {m.get('batch_number')}) - EXPIRED ({abs(days_left)} days ago) | Qty: {qty}")
        elif days_left < 120 or r_level in ["High", "Critical"]:
            critical_expiries.append(f"- {name} ({r_level} Risk, Expiry: {expiry_str}, {days_left} days left) | Qty: {qty} | Sales: {sales}/mo")
            
        # Collect low stock
        lead_time_days = 7
        daily_sales = sales / 30.0
        safety_stock = daily_sales * 5
        reorder_point = int((daily_sales * lead_time_days) + safety_stock)
        
        if qty <= reorder_point:
            low_stock_items.append(f"- {name} (Current Stock: {qty} | Reorder Point: {reorder_point} | Sales: {sales}/mo | Supplier: {m.get('supplier')})")

    context = f"""
    ### CURRENT PHARMACY SYSTEM STATE ###
    Total Unique Medicines: {total_items}
    Total Overall Stock: {total_qty}
    
    CRITICAL RISK / EXPIRING ITEMS:
    {chr(10).join(critical_expiries[:10]) if critical_expiries else "No high-risk or expired items."}
    
    LOW STOCK / REORDER ALERTS:
    {chr(10).join(low_stock_items[:10]) if low_stock_items else "All stock levels are adequate."}
    """
    return context

@chat_bp.route("", methods=["POST"])
@token_required
def chat_assistant(current_user):
    data = request.get_json() or {}
    user_message = data.get("message", "").strip()
    chat_history = data.get("history", []) # Array of objects: {role: "user"|"model", text: "..."}
    
    if not user_message:
        return jsonify({"message": "Please provide a message query."}), 400
        
    # Build current database state summary context
    system_context = build_inventory_context()
    
    # 1. If Gemini API Key is configured, use Gemini
    if Config.GEMINI_API_KEY and genai:
        try:
            # Format history for Gemini API
            # gemini-1.5-flash content structure requires a list of contents:
            # [{"role": "user"|"model", "parts": [text]}]
            contents = []
            for h in chat_history:
                role = "user" if h.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [h.get("text", "")]})
                
            # Add current system context as instruction prefix
            chat_instruction = f"""
            You are CareWise Assistant, a friendly and highly knowledgeable clinical pharmacist and inventory optimizer AI.
            You have access to the pharmacy's live database. Your goal is to help users manage inventory, predict expiry risks, and optimize procurement.
            
            Current inventory status context to answer user questions:
            {system_context}
            
            Guidelines:
            1. Rely on the provided context for specific figures, expiry days, or low stock warnings.
            2. Be professional, clear, and action-oriented. Suggest discounts, supplier returns, or reorders when matching context alerts.
            3. If the user asks general questions about medicines or alternatives, use your clinical knowledge base.
            4. Keep responses concise and formatted in Markdown.
            """
            
            # Append current query
            contents.append({"role": "user", "parts": [f"Context and Instructions:\n{chat_instruction}\n\nUser Question: {user_message}"]})
            
            # Initialize model based on package
            if hasattr(genai, "GenerativeModel"):
                # Old package (google.generativeai)
                genai.configure(api_key=Config.GEMINI_API_KEY)
                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content(contents)
                return jsonify({
                    "response": response.text,
                    "api_used": True
                }), 200
            else:
                # New package (google.genai)
                client = genai.Client(api_key=Config.GEMINI_API_KEY)
                model = "gemini-2.0-flash"
                response = client.models.generate_content(
                    model=model,
                    contents=contents
                )
                return jsonify({
                    "response": response.text,
                    "api_used": True
                }), 200
        except Exception as e:
            logger.error(f"Gemini chat failed: {e}")
            # Fall through to simulated responder if API crashes
            
    # 2. Local Fallback Simulated Chatbot if Gemini Key is not set or fails
    fallback_response = ""
    msg_lower = user_message.lower()
    
    if "expire" in msg_lower or "expiry" in msg_lower or "risk" in msg_lower:
        # User asking about expiries
        medicines = list(db.inventory.find({}))
        critical = []
        for m in medicines:
            qty = m.get("quantity", 0)
            sales = m.get("monthly_sales", 0)
            expiry_str = m.get("expiry_date", "")
            pred = risk_model.predict_risk(qty, sales, expiry_str, m.get("category", "General"), m.get("selling_price", 0.0))
            if pred["risk_level"] in ["High", "Critical"]:
                critical.append(f"- **{m.get('medicine_name')}** ({pred['risk_level']} Risk: {pred['risk_score']} points, Expiry: {expiry_str}) | Qty: {qty}")
        
        if critical:
            fallback_response = "Here are the medicines with the highest expiry risks:\n\n" + "\n".join(critical[:5]) + "\n\n*Recommended action: Apply promotions, discount items by 30%+, or return critical items to the supplier.*"
        else:
            fallback_response = "Good news! No items in your inventory currently show High or Critical expiry risks."
            
    elif "reorder" in msg_lower or "stock" in msg_lower or "procure" in msg_lower:
        # User asking about low stock / procurement
        medicines = list(db.inventory.find({}))
        reorders = []
        for m in medicines:
            qty = m.get("quantity", 0)
            sales = m.get("monthly_sales", 0)
            lead_time_days = 7
            daily_sales = sales / 30.0
            safety_stock = daily_sales * 5
            reorder_point = int((daily_sales * lead_time_days) + safety_stock)
            
            if qty <= reorder_point:
                reorders.append(f"- **{m.get('medicine_name')}** (Stock: {qty} units | ROP: {reorder_point} | Suggest ordering {sales * 2} units)")
                
        if reorders:
            fallback_response = "Here are the recommended restocks based on lead times and sales forecasts:\n\n" + "\n".join(reorders[:5]) + "\n\n*Recommended action: Submit procurement orders via the Smart Procurement panel.*"
        else:
            fallback_response = "All stock levels are currently healthy. No reorders are needed at this moment."
            
    else:
        fallback_response = f"""
        Hi there! I am the CareWise Assistant. (Note: Gemini API is running in local demo mode).
        
        I can help you analyze your inventory. Try asking me:
        1. *"Which medicines are most likely to expire?"*
        2. *"What should I reorder this month?"*
        3. *"Give me a summary of my current stock."*
        
        Your query: "{user_message}"
        """
        
    return jsonify({
        "response": fallback_response,
        "api_used": False
    }), 200
