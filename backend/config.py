import os
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

class Config:
    # Secret keys
    SECRET_KEY = os.getenv("SECRET_KEY", "carewise_super_secret_key_12345!")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "carewise_jwt_secret_key_67890!")
    
    # MongoDB Config
    MONGO_URI = os.getenv("MONGO_URI", "")
    
    # Gemini API Key
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
    
    # Email Config
    EMAIL_SENDER = os.getenv("EMAIL_SENDER", "")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
    EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER", "")
    EMAIL_SMTP_SERVER = os.getenv("EMAIL_SMTP_SERVER", "smtp.gmail.com")
    EMAIL_SMTP_PORT = int(os.getenv("EMAIL_SMTP_PORT", 587))
    
    # App Settings
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
