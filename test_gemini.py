import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

api_key = os.getenv("GEMINI_API_KEY")
print(f"Testing API key: {api_key[:10]}...")

try:
    genai.configure(api_key=api_key)
    # First list available models
    print("\nAvailable models:")
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
    
    # Try gemini-2.0-flash
    print("\nTrying gemini-2.0-flash...")
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content("Hello, test!")
    print("\nSUCCESS! API key is working!")
    print("Response:", response.text)
except Exception as e:
    print("\nERROR:", type(e).__name__, ":", str(e))
