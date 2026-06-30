import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { 
  Package, ShieldAlert, BadgeDollarSign, ShoppingCart, 
  Sparkles, RefreshCw, AlertCircle, ArrowUpRight 
} from "lucide-react";
import { Link } from "react-router-dom";

// Standard harmonious chart colors (Clinical Precision)
const COLORS = ["#003c90", "#006970", "#10b981", "#f59e0b", "#ba1a1a", "#7af1fc"];
const RISK_COLORS = {
  "Low": "#10b981",
  "Medium": "#f59e0b",
  "High": "#ba1a1a",
  "Critical": "#93000a"
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = () => {
    setLoading(true);
    api.get("/dashboard")
      .then((res) => {
        setData(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch dashboard data. Please try again.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">Compiling Analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-error-container border border-error/20 text-on-error-container p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button onClick={fetchDashboardData} className="ml-auto flex items-center gap-1.5 underline font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { metrics, charts } = data;

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      {/* Welcome & Quick Action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-level-1 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,60,144,0.05),transparent_40%)] pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-display text-on-surface tracking-wide">
            Welcome back, {user?.name.split(" ")[0]}! 👋
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 font-medium">
            Here is your pharmacy's automated expiry intelligence and inventory health summary.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            to="/ocr"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-sm font-bold shadow-level-1 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4" /> Scan Invoice OCR
          </Link>
          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-xl active:scale-95 transition-all"
            title="Reload metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Medicines */}
        <div className="card-level-1 p-5 flex items-center justify-between hover:border-outline transition-all duration-200">
          <div className="space-y-1">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Total Medicines</span>
            <h3 className="text-3xl font-black text-on-surface">{metrics.total_medicines}</h3>
            <p className="text-[11px] text-outline font-medium">Unique drug formulations</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* High Risk Expiries */}
        <div className="card-level-1 p-5 flex items-center justify-between hover:border-outline transition-all duration-200">
          <div className="space-y-1">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Expiry Alert List</span>
            <h3 className="text-3xl font-black text-error">{metrics.high_risk_medicines}</h3>
            <p className="text-[11px] text-outline font-medium">High/Critical risk levels</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-error/10 border border-error/20 text-error flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Projected Loss */}
        <div className="card-level-1 p-5 flex items-center justify-between hover:border-outline transition-all duration-200">
          <div className="space-y-1">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Projected Expiry Loss</span>
            <h3 className="text-3xl font-black text-warning">${metrics.projected_loss.toLocaleString()}</h3>
            <p className="text-[11px] text-outline font-medium">Value of at-risk stock</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-warning/10 border border-warning/20 text-warning flex items-center justify-center">
            <BadgeDollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Reorders Alert */}
        <div className="card-level-1 p-5 flex items-center justify-between hover:border-outline transition-all duration-200">
          <div className="space-y-1">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Upcoming Orders</span>
            <h3 className="text-3xl font-black text-stable">{metrics.upcoming_orders}</h3>
            <p className="text-[11px] text-outline font-medium">Stock below safety levels</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-stable/10 border border-stable/20 text-stable flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Expiry Risk Distribution (Donut) */}
        <div className="card-level-2 p-6 flex flex-col h-[400px]">
          <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider mb-4">Risk Level Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.risk_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.risk_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || "#ccc"} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c3c6d5", color: "#111c2c", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#434653" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Expiry Trend (Bar) */}
        <div className="card-level-2 p-6 flex flex-col h-[400px] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider">Monthly Expiry Trend</h3>
            <span className="text-[10px] text-error font-semibold bg-error/10 px-2 py-0.5 rounded border border-error/20">Next 6 Months</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly_expiry_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
                <XAxis dataKey="month" stroke="#737784" fontSize={11} />
                <YAxis stroke="#737784" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c3c6d5", color: "#111c2c", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                />
                <Bar dataKey="count" name="Medicines Expiring" fill="#003c90" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demand Forecasting Trend (Line) */}
        <div className="card-level-2 p-6 flex flex-col h-[400px] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider">Aggregated Demand Forecast</h3>
            <span className="text-[10px] text-stable font-semibold bg-stable/10 px-2 py-0.5 rounded border border-stable/20">AI Projection</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.forecast_trend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
                <XAxis dataKey="month" stroke="#737784" fontSize={11} />
                <YAxis stroke="#737784" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c3c6d5", color: "#111c2c", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#434653" }} />
                <Line type="monotone" dataKey="historical" name="Historical Sales" stroke="#434653" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#006970" strokeWidth={2.5} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (Pie) */}
        <div className="card-level-2 p-6 flex flex-col h-[400px]">
          <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider mb-4">Category Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.category_distribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {charts.category_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c3c6d5", color: "#111c2c", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Financial Action Advice panel */}
      <div className="bg-surface-container border border-outline-variant p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 justify-between shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 shrink-0 rounded-lg bg-stable/10 border border-stable/20 text-stable flex items-center justify-center">
            <BadgeDollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-sm">Potential Procurement Savings Available: <span className="text-stable font-black">${metrics.potential_savings.toLocaleString()}</span></h4>
            <p className="text-on-surface-variant text-xs mt-0.5 font-semibold">
              Return near-expiry products or discount overstocked items early to optimize cash flow.
            </p>
          </div>
        </div>
        <Link 
          to="/risk" 
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-surface-container-low border border-outline-variant text-on-surface rounded-xl text-xs font-bold whitespace-nowrap active:scale-95 transition-all shadow-sm"
        >
          View Risk Mitigation Actions <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
};

export default Dashboard;
