import os
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.utils.db import db
from werkzeug.security import generate_password_hash

# Import Blueprints
from backend.routes.auth import auth_bp
from backend.routes.inventory import inventory_bp
from backend.routes.dashboard import dashboard_bp
from backend.routes.risk import risk_bp
from backend.routes.forecast import forecast_bp
from backend.routes.procurement import procurement_bp
from backend.routes.ocr import ocr_bp
from backend.routes.similarity import similarity_bp
from backend.routes.chat import chat_bp

def seed_database():
    """Seeds the database with sample items and accounts if empty to enable instant demoing."""
    try:
        # Check if users collection is empty
        if db.users.count_documents({}) == 0:
            db.users.insert_one({
                "name": "Admin Carewise",
                "email": "admin@carewise.com",
                "password_hash": generate_password_hash("admin123"),
                "role": "Admin"
            })
            db.users.insert_one({
                "name": "Jane Pharmacist",
                "email": "pharmacist@carewise.com",
                "password_hash": generate_password_hash("pharmacy123"),
                "role": "Pharmacist"
            })
            print("Successfully seeded users: admin@carewise.com (admin123) & pharmacist@carewise.com (pharmacy123)")

        # Check if inventory collection is empty
        if db.inventory.count_documents({}) == 0:
            sample_medicines = [
                {
                    "medicine_name": "Dolo 650",
                    "generic_name": "Paracetamol (650mg)",
                    "category": "Analgesic",
                    "batch_number": "DOL8892",
                    "supplier": "Micro Labs",
                    "manufacturing_date": "2025-01-15",
                    "expiry_date": "2026-08-30", # Expiring very soon!
                    "quantity": 350,
                    "monthly_sales": 100,
                    "purchase_price": 8.00,
                    "selling_price": 12.00
                },
                {
                    "medicine_name": "Azithral 500",
                    "generic_name": "Azithromycin (500mg)",
                    "category": "Antibiotic",
                    "batch_number": "AZT5521",
                    "supplier": "Alembic Pharma",
                    "manufacturing_date": "2025-02-10",
                    "expiry_date": "2026-07-15", # Critical Risk!
                    "quantity": 210,
                    "monthly_sales": 60,
                    "purchase_price": 62.00,
                    "selling_price": 85.00
                },
                {
                    "medicine_name": "Crocin 650",
                    "generic_name": "Paracetamol (650mg)",
                    "category": "Analgesic",
                    "batch_number": "CRC1245",
                    "supplier": "GlaxoSmithKline",
                    "manufacturing_date": "2025-03-01",
                    "expiry_date": "2027-02-28", # Healthy expiry
                    "quantity": 250,
                    "monthly_sales": 80,
                    "purchase_price": 10.00,
                    "selling_price": 15.00
                },
                {
                    "medicine_name": "Atorva 10",
                    "generic_name": "Atorvastatin (10mg)",
                    "category": "Cardiovascular",
                    "batch_number": "ATV8921",
                    "supplier": "Zydus Healthcare",
                    "manufacturing_date": "2025-01-01",
                    "expiry_date": "2026-12-31",
                    "quantity": 20, # Low stock! (Monthly sales is 50)
                    "monthly_sales": 50,
                    "purchase_price": 18.00,
                    "selling_price": 26.50
                },
                {
                    "medicine_name": "Okacet 10",
                    "generic_name": "Cetirizine (10mg)",
                    "category": "General",
                    "batch_number": "OKC3341",
                    "supplier": "Cipla Ltd",
                    "manufacturing_date": "2025-04-10",
                    "expiry_date": "2027-03-31",
                    "quantity": 8, # Low stock! (Monthly sales is 25)
                    "monthly_sales": 25,
                    "purchase_price": 6.50,
                    "selling_price": 10.00
                },
                {
                    "medicine_name": "Amoxyclav 625",
                    "generic_name": "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
                    "category": "Antibiotic",
                    "batch_number": "AMX7712",
                    "supplier": "Alkem Laboratories",
                    "manufacturing_date": "2025-02-20",
                    "expiry_date": "2026-09-25", # Medium/High Risk
                    "quantity": 80,
                    "monthly_sales": 30,
                    "purchase_price": 42.00,
                    "selling_price": 58.00
                },
                {
                    "medicine_name": "Neurobion Forte",
                    "generic_name": "Vitamin B-Complex",
                    "category": "Vitamins",
                    "batch_number": "NUB9923",
                    "supplier": "Procter & Gamble",
                    "manufacturing_date": "2025-05-01",
                    "expiry_date": "2027-04-30",
                    "quantity": 500,
                    "monthly_sales": 120,
                    "purchase_price": 12.00,
                    "selling_price": 18.00
                }
            ]
            for med in sample_medicines:
                db.inventory.insert_one(med)
            print("Successfully seeded inventory with sample medicines.")
            
    except Exception as e:
        print(f"Error seeding database: {e}")

# Initialize Flask app
app = Flask(__name__)

# Configure CORS (allow React frontend)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(inventory_bp, url_prefix="/api/inventory")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(risk_bp, url_prefix="/api/risk")
app.register_blueprint(forecast_bp, url_prefix="/api/forecast")
app.register_blueprint(procurement_bp, url_prefix="/api/procurement")
app.register_blueprint(ocr_bp, url_prefix="/api/ocr")
app.register_blueprint(similarity_bp, url_prefix="/api/similarity")
app.register_blueprint(chat_bp, url_prefix="/api/chat")

@app.route("/")
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "CareWise AI Backend API Server",
        "database": "MongoDB / Mock fallback active"
    }), 200

# Error Handler
@app.errorhandler(404)
def not_found(error):
    return jsonify({"message": "Resource not found"}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({"message": "Internal server error"}), 500

# Seed on startup
seed_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
