import { useState, useEffect } from "react";
import api from "../services/api";
import { 
  ShieldAlert, Sparkles, TrendingDown, RefreshCw, 
  HelpCircle, ArrowRight, ShieldCheck, BadgeInfo, Mail
} from "lucide-react";

const ExpiryRisk = () => {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendingAlerts, setSendingAlerts] = useState(false);
  
  // Sandbox state
  const [sandboxData, setSandboxData] = useState({
    medicine_name: "Test Sandbox Med",
    quantity: 150,
    monthly_sales: 10,
    expiry_date: "",
    category: "General",
    selling_price: 15.00
  });
  const [sandboxResult, setSandboxResult] = useState(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxError, setSandboxError] = useState("");

  const fetchRisks = () => {
    setLoading(true);
    api.get("/risk/all")
      .then((res) => {
        setRisks(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to load risk evaluations.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const sendAlerts = async () => {
    setSendingAlerts(true);
    setError("");
    
    try {
      const res = await api.post("/risk/send-alerts");
      alert(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send expiry alerts.");
    } finally {
      setSendingAlerts(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, []);

  const handleSandboxSubmit = async (e) => {
    e.preventDefault();
    if (!sandboxData.expiry_date) {
      setSandboxError("Expiry date is required.");
      return;
    }
    
    setSandboxLoading(true);
    setSandboxError("");
    setSandboxResult(null);
    
    try {
      const res = await api.post("/risk/predict", sandboxData);
      setSandboxResult(res.data);
    } catch (err) {
      setSandboxError("Failed to run sandbox prediction.");
    } finally {
      setSandboxLoading(false);
    }
  };

  const getRiskBadgeStyles = (level) => {
    switch (level) {
      case "Critical":
        return "chip-critical";
      case "High":
        return "chip-high";
      case "Medium":
        return "chip-medium";
      default:
        return "chip-stable";
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">AI Expiry Risk Intelligence</h1>
          <p className="text-on-surface-variant text-xs mt-1 font-semibold">
            Evaluate drug batches using Random Forest Classifiers trained on stock levels, daily sales rates, and expiry timing.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRisks}
            className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-xl text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-Evaluate Risks
          </button>
          <button
            onClick={sendAlerts}
            disabled={sendingAlerts}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-level-1"
          >
            <Mail className="w-3.5 h-3.5" />
            {sendingAlerts ? "Sending Alerts..." : "Send Expiry Alerts"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Risk Grid Listings (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Inventory Risk Rankings</h3>
          
          {loading ? (
            <div className="card-level-1 p-16 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="card-level-1 p-8 text-center text-error text-xs">{error}</div>
          ) : risks.length === 0 ? (
            <div className="card-level-1 p-16 text-center text-on-surface-variant text-xs font-semibold">
              No items in inventory to analyze. Seed some items first.
            </div>
          ) : (
            <div className="space-y-4">
              {risks.map((item) => (
                <div 
                  key={item.id} 
                  className="card-level-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-outline transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-on-surface font-extrabold text-sm">{item.medicine_name}</h4>
                      <span className="text-[10px] text-on-surface-variant">({item.category})</span>
                    </div>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-on-surface-variant text-[11px] font-semibold">
                      <div>Stock: <span className="text-on-surface">{item.quantity} units</span></div>
                      <div>Sales: <span className="text-on-surface">{item.monthly_sales}/mo</span></div>
                      <div>Expiry: <span className="text-on-surface">{item.expiry_date}</span></div>
                    </div>
                  </div>

                  {/* Risk Metric Display */}
                  <div className="flex flex-col md:items-end gap-1 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className={getRiskBadgeStyles(item.risk_level)}>
                        {item.risk_level} Risk
                      </span>
                      <span className="text-on-surface font-black text-sm">{item.risk_score} pts</span>
                    </div>
                    <span className="text-on-surface-variant text-[10px] font-bold mt-1 text-left md:text-right max-w-xs">
                      👉 {item.recommended_action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sandbox Simulator Panel (Right 1 col) */}
        <div className="space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">AI Model Sandbox</h3>
          <div className="card-level-2 p-6">
            <h4 className="text-on-surface font-bold text-sm mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> Model Simulator
            </h4>
            
            <form onSubmit={handleSandboxSubmit} className="space-y-4 text-xs font-semibold">
              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase tracking-wider block text-[10px]">Drug Category</label>
                <select
                  value={sandboxData.category}
                  onChange={(e) => setSandboxData({...sandboxData, category: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="Analgesic">Analgesic</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Dermatological">Dermatological</option>
                  <option value="Vitamins">Vitamins</option>
                  <option value="General">General</option>
                </select>
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase tracking-wider block text-[10px]">Current Quantity</label>
                <input
                  type="number"
                  value={sandboxData.quantity}
                  onChange={(e) => setSandboxData({...sandboxData, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Monthly Sales */}
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase tracking-wider block text-[10px]">Monthly Sales rate</label>
                <input
                  type="number"
                  value={sandboxData.monthly_sales}
                  onChange={(e) => setSandboxData({...sandboxData, monthly_sales: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Selling Price */}
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase tracking-wider block text-[10px]">Selling Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={sandboxData.selling_price}
                  onChange={(e) => setSandboxData({...sandboxData, selling_price: parseFloat(e.target.value) || 0.0})}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase tracking-wider block text-[10px]">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={sandboxData.expiry_date}
                  onChange={(e) => setSandboxData({...sandboxData, expiry_date: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={sandboxLoading}
                className="w-full py-2 bg-primary hover:bg-primary-container text-on-primary rounded-lg font-bold shadow-level-1 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {sandboxLoading ? "Processing..." : "Run Sandbox Test"}
              </button>
            </form>

            {/* Sandbox Result display */}
            {sandboxResult && (
              <div className="mt-5 p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase">Prediction Results</span>
                  <span className={getRiskBadgeStyles(sandboxResult.risk_level)}>
                    {sandboxResult.risk_level}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-outline block font-bold">RISK SCORE</span>
                    <span className="text-on-surface font-extrabold text-sm">{sandboxResult.risk_score} / 99</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline block font-bold">DAYS TO EXPIRY</span>
                    <span className="text-on-surface font-extrabold text-sm">{sandboxResult.days_left} days</span>
                  </div>
                </div>

                <div className="text-[11px] bg-surface-container p-2.5 rounded border border-outline-variant">
                  <span className="text-[9px] text-primary block font-bold uppercase tracking-wider mb-0.5">Recommended Action</span>
                  <p className="text-on-surface font-medium leading-relaxed">{sandboxResult.recommended_action}</p>
                </div>
              </div>
            )}

            {sandboxError && (
              <div className="mt-4 p-3 bg-error-container border border-error/20 text-on-error-container text-xs rounded-lg font-semibold">
                {sandboxError}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};

export default ExpiryRisk;
