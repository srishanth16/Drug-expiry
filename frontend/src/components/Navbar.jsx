import { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Bell, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
import api from "../services/api";

const Navbar = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [criticalCount, setCriticalCount] = useState(0);

  // Determine page title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Pharmacy Intelligence Dashboard";
      case "/inventory":
        return "Medicine Inventory Database";
      case "/risk":
        return "AI Expiry Risk Analysis";
      case "/forecast":
        return "Drug Demand Forecasting";
      case "/procurement":
        return "Smart Procurement & Reorders";
      case "/ocr":
        return "OCR Invoice Scanner & Parser";
      case "/similarity":
        return "Drug Similarity & Substitutions";
      case "/chat":
        return "AI Assistant Chatbot";
      default:
        return "CareWise Platform";
    }
  };

  useEffect(() => {
    if (user) {
      // Pull dashboard summaries to show active alerts count
      api.get("/dashboard")
        .then((res) => {
          if (res.data?.metrics) {
            setCriticalCount(res.data.metrics.high_risk_medicines);
          }
        })
        .catch(() => {});
    }
  }, [user, location.pathname]);

  return (
    <header className="h-16 bg-surface-container-lowest border-b border-outline-variant text-on-surface flex items-center justify-between px-8 sticky top-0 z-10 w-[calc(100%-16rem)] ml-64">
      {/* Page Title */}
      <div>
        <h2 className="font-bold font-display text-lg text-on-surface tracking-wide">{getPageTitle()}</h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-on-surface-variant text-xs font-semibold bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </div>

        {/* Expiry Notification Alert */}
        {criticalCount > 0 ? (
          <div className="chip-critical animate-pulse flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{criticalCount} Critical Expiries Found</span>
          </div>
        ) : (
          <div className="chip-stable flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Inventory Health Stable</span>
          </div>
        )}

        {/* Bell Icon Notification */}
        <button className="relative p-2 rounded-lg bg-surface-container border border-outline-variant text-outline hover:text-primary hover:border-primary transition-all">
          <Bell className="w-4 h-4" />
          {criticalCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error"></span>
          )}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
