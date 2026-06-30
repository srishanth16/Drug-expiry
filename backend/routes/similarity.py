from flask import Blueprint, request, jsonify
from backend.config import Config
from backend.utils.db import db
from backend.utils.auth_middleware import token_required
import logging

logger = logging.getLogger("similarity_route")

similarity_bp = Blueprint("similarity", __name__)

# Try to import Gemini configuration
try:
    import google.generativeai as genai
except Exception:
    pass

# Local dictionary mapping brands to generic drug profiles and brand alternatives
DRUG_KNOWLEDGE_BASE = {
    "dolo 650": {
        "generic": "Paracetamol (650mg)",
        "category": "Analgesic / Antipyretic",
        "alternatives": ["Crocin 650", "Calpol 650", "Paracip 650", "Pacimol 650"]
    },
    "crocin 650": {
        "generic": "Paracetamol (650mg)",
        "category": "Analgesic / Antipyretic",
        "alternatives": ["Dolo 650", "Calpol 650", "Paracip 650", "Pacimol 650"]
    },
    "calpol 650": {
        "generic": "Paracetamol (650mg)",
        "category": "Analgesic / Antipyretic",
        "alternatives": ["Dolo 650", "Crocin 650", "Paracip 650", "Pacimol 650"]
    },
    "paracip 650": {
        "generic": "Paracetamol (650mg)",
        "category": "Analgesic / Antipyretic",
        "alternatives": ["Dolo 650", "Crocin 650", "Calpol 650", "Pacimol 650"]
    },
    "combiflam": {
        "generic": "Ibuprofen (400mg) + Paracetamol (325mg)",
        "category": "Analgesic / Anti-inflammatory",
        "alternatives": ["Ibugesic Plus", "Flexon", "Brufen (Ibuprofen only)"]
    },
    "brufen 400": {
        "generic": "Ibuprofen (400mg)",
        "category": "NSAID / Analgesic",
        "alternatives": ["Brufen 600", "Ibugesic 400", "Combiflam"]
    },
    "mox 500": {
        "generic": "Amoxicillin (500mg)",
        "category": "Antibiotic (Penicillin)",
        "alternatives": ["Amoxil 500", "Almox 500", "Novamox 500"]
    },
    "azithral 500": {
        "generic": "Azithromycin (500mg)",
        "category": "Antibiotic (Macrolide)",
        "alternatives": ["Azee 500", "Azibact 500", "Azithrocin 500"]
    },
    "glycomet 500": {
        "generic": "Metformin Hydrochloride (500mg)",
        "category": "Anti-diabetic (Biguanide)",
        "alternatives": ["Glucophage 500", "Obimet 500", "Metformin 500"]
    },
    "atorva 10": {
        "generic": "Atorvastatin (10mg)",
        "category": "Cardiovascular / Statin",
        "alternatives": ["Lipitor 10", "Tonact 10", "Storvas 10"]
    },
    "okacet": {
        "generic": "Cetirizine Hydrochloride (10mg)",
        "category": "Antihistamine / Anti-allergy",
        "alternatives": ["Zyrtec 10", "Cetzine 10", "Alerid 10"]
    }
}

def get_similarity_from_gemini(drug_name):
    """Uses Gemini API to search for therapeutic alternatives for custom or complex drugs."""
    if not Config.GEMINI_API_KEY:
        return None
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""
        You are a clinical pharmacy expert. Find therapeutic alternatives for the medicine: "{drug_name}".
        Provide your response as a valid JSON object. Do not include markdown code block syntax (like ```json ... ```) in your output, just return the raw JSON text.
        The JSON object must contain the following keys:
        - "medicine_name": the name of the medicine queried
        - "generic_name": the active ingredient (generic chemical name)
        - "category": chemical class or drug category (e.g. "Antibiotic", "Analgesic")
        - "alternatives": a list of 3 to 5 common brand names (including dosage details if relevant) that contain the same or similar therapeutic active ingredients.
        - "clinical_note": a 1-sentence warning or usage instruction for substitution.
        
        Ensure it is a valid JSON.
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean markdown code blocks
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
            
        parsed_json = json.loads(text)
        return parsed_json
    except Exception as e:
        logger.error(f"Gemini drug similarity extraction failed: {e}")
        return None

@similarity_bp.route("", methods=["GET"])
@token_required
def search_drug_similarity(current_user):
    drug_name = request.args.get("name", "").strip().lower()
    
    if not drug_name:
        return jsonify({"message": "Please provide a drug 'name' parameter."}), 400
        
    # 1. Search local dictionary (exact matches or sub-brand name matches)
    match_data = None
    for key, value in DRUG_KNOWLEDGE_BASE.items():
        if key == drug_name or drug_name in key:
            match_data = {
                "medicine_name": key.title(),
                "generic_name": value["generic"],
                "category": value["category"],
                "alternatives": value["alternatives"],
                "clinical_note": "Ensure patient is not allergic to the generic formulation before substituting."
            }
            break
            
    # 2. If no local match and Gemini API is available, fetch dynamically
    if not match_data and Config.GEMINI_API_KEY:
        gemini_result = get_similarity_from_gemini(drug_name)
        if gemini_result:
            match_data = gemini_result
            
    # 3. Fallback default if nothing found (basic search helper)
    if not match_data:
        # Search our inventory collection to see if we have items sharing the same category
        inventory_items = list(db.inventory.find({}))
        related_brands = []
        
        # Check if the query matches anything in our inventory
        med_in_inv = None
        for item in inventory_items:
            if drug_name in item.get("medicine_name", "").lower():
                med_in_inv = item
                break
                
        if med_in_inv:
            generic = med_in_inv.get("generic_name", "Unknown Active Ingredient")
            category = med_in_inv.get("category", "General")
            
            # Find all other medicines in inventory with the same category or generic name
            for item in inventory_items:
                if item.get("medicine_name") != med_in_inv.get("medicine_name"):
                    if item.get("generic_name") == generic or item.get("category") == category:
                        related_brands.append(item.get("medicine_name"))
                        
            match_data = {
                "medicine_name": med_in_inv.get("medicine_name"),
                "generic_name": generic,
                "category": category,
                "alternatives": list(set(related_brands))[:4],
                "clinical_note": "Alternatives compiled from your current pharmacy stock."
            }
            
    if not match_data:
        return jsonify({
            "medicine_name": drug_name.title(),
            "generic_name": "Not Found",
            "category": "Unknown",
            "alternatives": [],
            "clinical_note": "No match found in local directory or active stock. Please check spelling."
        }), 200
        
    return jsonify(match_data), 200
