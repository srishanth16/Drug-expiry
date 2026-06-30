💊 CareWise – AI-Powered Drug Expiry Intelligence & Inventory Optimization Platform

CareWise is a full-stack AI-powered pharmacy inventory management system designed to reduce medicine wastage, optimize inventory, and assist pharmacists with intelligent decision-making.

The platform combines **Machine Learning**, **Computer Vision**, and **Generative AI** to predict expiry risks, forecast demand, automate invoice processing, and provide real-time inventory insights.

---

🚀 Features

### 🔐 Authentication & Authorization
- JWT-based Login & Registration
- Role-based access (Admin & Pharmacist)
- Protected Routes
- Secure Password Authentication

---
 📦 Inventory Management
- Add Medicines
- Update Medicine Details
- Delete Medicines
- Search & Filter Inventory
- Batch Number Tracking
- Supplier Information
- Expiry Date Monitoring

---

🤖 AI Expiry Risk Prediction

Uses a **Random Forest Machine Learning model** to predict the probability that a medicine will expire before it is sold.

 Model Features
- Current Stock
- Monthly Sales
- Days Until Expiry
- Medicine Category
- Purchase Price
- Selling Price

 Output
- Risk Score (0–100%)
- Risk Level
- Recommended Action

---

 📈 Demand Forecasting

Predicts future medicine demand using historical sales trends and seasonal analysis.

Provides:
- Monthly Demand Forecast
- Sales Trend Visualization
- Inventory Planning Support

---

 🛒 Smart Procurement Assistant

Automatically recommends purchase quantities using:

- Safety Stock
- Reorder Point
- Forecasted Demand
- Seasonal Multipliers

Helps prevent:

- Overstocking
- Understocking
- Medicine Expiry

---

 📄 OCR Invoice Scanner

Automatically extracts medicine information from supplier invoices using OCR.

Extracts:
- Medicine Name
- Batch Number
- Expiry Date
- Quantity

Then imports directly into inventory.

---

 💬 AI Chat Assistant

Powered by **Google Gemini AI**.

Supports questions like:

- Which medicines are at high expiry risk?
- What should I reorder this month?
- Show near-expiry medicines.
- How can I reduce inventory loss?

The assistant uses live inventory data to generate intelligent responses.

---

 💊 Drug Similarity Engine

Find therapeutic alternatives for medicines.

Example:

```
Dolo 650
↓
Crocin 650
Paracip 650
Calpol 650
```

---

 📊 Analytics Dashboard

Real-time business intelligence dashboard.

Includes:

- Total Medicines
- High Risk Medicines
- Average Risk Score
- Projected Financial Loss
- Monthly Expiry Trends
- Inventory Distribution
- Procurement Recommendations

---
 🏗 System Architecture

```
                 React Frontend
                       │
               REST API Requests
                       │
               Flask Backend APIs
                       │
      ┌────────────────┼─────────────────┐
      │                │                 │
 Inventory       Machine Learning      OCR
  Module         Risk Prediction     PaddleOCR
      │                │                 │
      └────────────────┼─────────────────┘
                       │
                  MongoDB Atlas
                       │
             Gemini AI Assistant
                       │
               Analytics Dashboard
```

---

🧠 AI Technologies Used

1. Machine Learning

Random Forest Classifier

Used for:

- Expiry Risk Prediction
- Inventory Risk Analysis

---

2. Computer Vision

PaddleOCR

Used for:

- Invoice Digitization
- Medicine Information Extraction

---

3. Generative AI

Google Gemini API

Used for:

- Pharmacy Assistant
- Inventory Queries
- Recommendation Generation

---

 🛠 Tech Stack

Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Recharts

 Backend

- Flask
- Flask-CORS
- JWT Authentication
- PyMongo

Database

- MongoDB Atlas

AI / Machine Learning

- Scikit-Learn
- NumPy
- Pandas

OCR

- PaddleOCR

AI Assistant

- Google Gemini API

Deployment

- Frontend → Vercel
- Backend → Render
- Database → MongoDB Atlas

---
 📂 Project Structure

```
CareWise
│
├── frontend
│   ├── src
│   ├── pages
│   ├── components
│   ├── context
│   └── services
│
├── backend
│   ├── routes
│   ├── models
│   ├── utils
│   ├── config.py
│   └── app.py
│
├── requirements.txt
└── README.md
```

---

⚙ Installation

 Clone Repository

```bash
git clone https://github.com/srishanth16/Drug-expiry.git
```

---

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python run.py
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 🔑 Environment Variables

Create `.env`

```
SECRET_KEY=your_secret_key

JWT_SECRET_KEY=your_jwt_secret

MONGO_URI=your_mongodb_connection

GEMINI_API_KEY=your_gemini_api_key
```

---

 📡 API Modules

- Authentication
- Inventory Management
- Risk Prediction
- Demand Forecasting
- Procurement
- OCR Scanner
- AI Chat
- Drug Similarity
- Dashboard

---

 🎯 Future Enhancements

- Email Notifications
- WhatsApp Expiry Alerts
- Barcode Scanner Integration
- Multi-Branch Inventory
- Supplier Portal
- Deep Learning Forecasting
- Mobile Application
- Automated Purchase Orders

---


👨‍💻 Author

**Srishanth Reddy**

GitHub: https://github.com/srishanth16

---

 📄 License

This project is developed for educational and research purposes.
