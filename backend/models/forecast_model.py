import datetime
import math

# Define seasonal multipliers based on month index (1-12) and categories
# E.g. Antibiotics/Analgesics spike in winter (cough/flu season) or monsoons
SEASONAL_FACTORS = {
    "Analgesic": {1: 1.2, 2: 1.1, 3: 0.9, 4: 0.8, 5: 0.8, 6: 0.9, 7: 1.0, 8: 1.1, 9: 1.1, 10: 1.0, 11: 1.2, 12: 1.3},
    "Antibiotic": {1: 1.3, 2: 1.2, 3: 1.0, 4: 0.8, 5: 0.7, 6: 0.9, 7: 1.1, 8: 1.2, 9: 1.1, 10: 1.0, 11: 1.2, 12: 1.4},
    "Cardiovascular": {1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 1.0}, # Stable
    "Dermatological": {1: 0.8, 2: 0.9, 3: 1.1, 4: 1.2, 5: 1.3, 6: 1.2, 7: 1.0, 8: 0.9, 9: 0.9, 10: 0.9, 11: 0.8, 12: 0.8}, # Spikes in dry winter or hot summer
    "Vitamins": {1: 1.1, 2: 1.0, 3: 1.0, 4: 0.9, 5: 0.9, 6: 1.0, 7: 1.1, 8: 1.1, 9: 1.0, 10: 1.1, 11: 1.2, 12: 1.2},
    "General": {1: 1.0, 2: 1.0, 3: 1.0, 4: 1.0, 5: 1.0, 6: 1.0, 7: 1.0, 8: 1.0, 9: 1.0, 10: 1.0, 11: 1.0, 12: 1.0}
}

class DemandForecaster:
    @staticmethod
    def forecast_demand(medicine, num_months=4):
        """Generates future monthly demand predictions using historical moving average and seasonal weightings."""
        monthly_sales = max(medicine.get("monthly_sales", 10), 1)
        category = medicine.get("category", "General")
        
        # Get current month index
        now = datetime.datetime.now()
        months_names = ["January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"]
        
        forecast_results = []
        
        # 1. Backfill simulated historical data for visual charts (previous 3 months)
        for i in range(-3, 0):
            hist_date = now + datetime.timedelta(days=i*30)
            m_idx = hist_date.month
            m_name = months_names[m_idx - 1]
            
            # Apply seasonality to history
            cat_factors = SEASONAL_FACTORS.get(category, SEASONAL_FACTORS["General"])
            factor = cat_factors.get(m_idx, 1.0)
            
            # Add minor noise
            noise = (math.sin(i * 1.5) * 0.05) + 1.0
            historical_val = max(int(monthly_sales * factor * noise), 1)
            
            forecast_results.append({
                "month": m_name,
                "historical": historical_val,
                "forecast": None
            })
            
        # 2. Project future data (current month + next N months)
        for i in range(0, num_months + 1):
            future_date = now + datetime.timedelta(days=i*30)
            m_idx = future_date.month
            m_name = months_names[m_idx - 1]
            
            cat_factors = SEASONAL_FACTORS.get(category, SEASONAL_FACTORS["General"])
            factor = cat_factors.get(m_idx, 1.0)
            
            # Add positive trend for winter or other seasonal surges
            trend = 1.0 + (i * 0.02) # general minor growth
            forecast_val = max(int(monthly_sales * factor * trend), 1)
            
            if i == 0:
                # Current month is the transition (show both or merge)
                forecast_results.append({
                    "month": m_name,
                    "historical": monthly_sales,
                    "forecast": forecast_val
                })
            else:
                forecast_results.append({
                    "month": m_name,
                    "historical": None,
                    "forecast": forecast_val
                })
                
        return forecast_results
