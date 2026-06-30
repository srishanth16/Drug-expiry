import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import datetime
import os
import pickle
import logging

logger = logging.getLogger("ml_models")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "expiry_rf_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "category_encoder.pkl")

# Supported categories
CATEGORIES = ["Analgesic", "Antibiotic", "Antiseptic", "Cardiovascular", "Dermatological", "Vitamins", "General"]

class ExpiryRiskModel:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        # Initialize encoder with default categories
        self.label_encoder.fit(CATEGORIES)
        self.load_or_train()

    def generate_synthetic_data(self, num_samples=1000):
        """Generates realistic drug expiry dataset to train the Random Forest Classifier."""
        np.random.seed(42)
        
        quantities = np.random.randint(5, 500, num_samples)
        monthly_sales = np.random.randint(2, 120, num_samples)
        days_left = np.random.randint(10, 730, num_samples)
        categories = np.random.choice(CATEGORIES, num_samples)
        prices = np.random.uniform(5.0, 150.0, num_samples)
        
        # Calculate a deterministic risk label for training targets
        # High quantity, low sales, and short days_left = High/Critical risk
        risk_scores = []
        labels = []
        
        for q, s, d, cat, p in zip(quantities, monthly_sales, days_left, categories, prices):
            # Monthly coverage: how many months of stock do we have?
            stock_coverage = q / max(s, 1)
            months_left = d / 30.0
            
            # Risk score calculation formula
            score = 0
            # Factor 1: Expiry urgency (max 45 points)
            if months_left <= 1:
                score += 45
            elif months_left <= 3:
                score += 35
            elif months_left <= 6:
                score += 20
            elif months_left <= 12:
                score += 10
            else:
                score += 2
                
            # Factor 2: Overstocking / Under-selling risk (max 40 points)
            if stock_coverage > months_left:
                # We have more stock than we can sell before expiry
                excess_ratio = stock_coverage / max(months_left, 0.1)
                if excess_ratio > 3.0:
                    score += 40
                elif excess_ratio > 1.5:
                    score += 30
                else:
                    score += 15
            else:
                score += 5
                
            # Factor 3: Financial value weight (max 15 points)
            if p > 100:
                score += 15
            elif p > 50:
                score += 10
            elif p > 20:
                score += 5
            else:
                score += 2
                
            score = min(max(int(score), 0), 99)
            risk_scores.append(score)
            
            # Label conversion
            if score >= 85:
                labels.append("Critical")
            elif score >= 65:
                labels.append("High")
            elif score >= 40:
                labels.append("Medium")
            else:
                labels.append("Low")
                
        df = pd.DataFrame({
            "quantity": quantities,
            "monthly_sales": monthly_sales,
            "days_left": days_left,
            "category": categories,
            "price": prices,
            "risk_score": risk_scores,
            "risk_level": labels
        })
        return df

    def load_or_train(self):
        """Loads a pre-trained model or trains a new one on synthetic data."""
        if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    self.model = pickle.load(f)
                with open(ENCODER_PATH, "rb") as f:
                    self.label_encoder = pickle.load(f)
                logger.info("Successfully loaded pre-trained Expiry Risk RF model.")
                return
            except Exception as e:
                logger.error(f"Error loading model: {e}. Retraining...")

        # Generate data and train
        logger.info("Training Expiry Risk Random Forest Classifier...")
        df = self.generate_synthetic_data()
        
        # Prepare features
        # Encode category
        X = df[["quantity", "monthly_sales", "days_left", "category", "price"]].copy()
        
        # Ensure all category inputs fit within encoder
        X["category"] = self.label_encoder.transform(X["category"])
        y = df["risk_level"]
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X, y)
        
        # Save model and encoder
        try:
            with open(MODEL_PATH, "wb") as f:
                pickle.dump(self.model, f)
            with open(ENCODER_PATH, "wb") as f:
                pickle.dump(self.label_encoder, f)
            logger.info("Expiry Risk model trained and saved successfully.")
        except Exception as e:
            logger.error(f"Failed to save trained model: {e}")

    def predict_risk(self, quantity, monthly_sales, expiry_date_str, category, price):
        """Predicts the expiry risk level, score, and recommendation for a single medicine."""
        try:
            # Calculate days left until expiry
            expiry_date = datetime.datetime.strptime(expiry_date_str, "%Y-%m-%d")
            today = datetime.datetime.now()
            days_left = (expiry_date - today).days
        except Exception:
            days_left = 180  # Default fallback if parsing fails
            
        # Ensure category is registered in label encoder
        if category not in self.label_encoder.classes_:
            # Fallback to General
            category = "General"
            
        category_encoded = self.label_encoder.transform([category])[0]
        
        # Predict using Random Forest
        input_data = pd.DataFrame([[quantity, monthly_sales, days_left, category_encoded, price]], 
                                  columns=["quantity", "monthly_sales", "days_left", "category", "price"])
        
        risk_level = self.model.predict(input_data)[0]
        
        # Calculate risk score based on model decision & distance
        # To make it dynamic and realistic, we can interpolate a score
        # within the selected category's range
        stock_coverage = quantity / max(monthly_sales, 1)
        months_left = max(days_left / 30.0, 0.1)
        
        base_score = 0
        if risk_level == "Critical":
            base_score = 85 + min(int((stock_coverage / months_left) * 5), 14)
        elif risk_level == "High":
            base_score = 65 + min(int((stock_coverage / months_left) * 10), 19)
        elif risk_level == "Medium":
            base_score = 40 + min(int((stock_coverage / months_left) * 15), 24)
        else:
            base_score = 5 + min(int(months_left * 2), 34)
            
        risk_score = min(max(int(base_score), 0), 99)
        
        # Determine recommended actions
        if risk_level == "Critical":
            recommended_action = "Return to supplier immediately (or write off)"
        elif risk_level == "High":
            recommended_action = "Apply 30%+ discount or bundle with fast-selling items"
        elif risk_level == "Medium":
            recommended_action = "Relocate to front shelves and run sales promotions"
        else:
            recommended_action = "No action needed. Healthy stock levels"
            
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "recommended_action": recommended_action,
            "days_left": days_left
        }

# Instantiate model
risk_model = ExpiryRiskModel()
