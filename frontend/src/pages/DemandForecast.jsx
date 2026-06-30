import { useState, useEffect } from "react";
import api from "../services/api";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ReferenceLine 
} from "recharts";
import { TrendingUp, AlertCircle, ShoppingBag, Eye, HelpCircle } from "lucide-react";

const DemandForecast = () => {
  const [medicines, setMedicines] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [forecastData, setForecastData] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [error, setError] = useState("");

  // Fetch all medicines list to populate the selector
  useEffect(() => {
    setLoadingList(true);
    api.get("/inventory")
      .then((res) => {
        setMedicines(res.data);
        if (res.data.length > 0) {
          setSelectedMedId(res.data[0]._id);
        }
        setError("");
      })
      .catch((err) => {
        setError("Failed to load medicines list.");
      })
      .finally(() => {
        setLoadingList(false);
      });
  }, []);

  // Fetch forecast data when a medicine is selected
  const fetchForecast = (medId) => {
    if (!medId) return;
    setLoadingForecast(true);
    api.post("/forecast", { medicine_id: medId })
      .then((res) => {
        setForecastData(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch demand forecast.");
        console.error(err);
      })
      .finally(() => {
        setLoadingForecast(false);
      });
  };

  useEffect(() => {
    if (selectedMedId) {
      fetchForecast(selectedMedId);
    }
  }, [selectedMedId]);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">Demand Forecasting</h1>
        <p className="text-on-surface-variant text-xs mt-1 font-semibold">
          Project future sales requirements based on historical moving averages, sales velocities, and category-based seasonal variables.
        </p>
      </div>

      {/* Select medicine bar */}
      <div className="card-level-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider block">Choose Medicine to Forecast</label>
          {loadingList ? (
            <div className="h-9 w-64 bg-surface-container animate-pulse rounded-lg border border-outline-variant"></div>
          ) : (
            <select
              value={selectedMedId}
              onChange={(e) => setSelectedMedId(e.target.value)}
              className="w-full md:w-80 px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs font-semibold focus:outline-none focus:border-primary transition-all appearance-none"
            >
              {medicines.map((med) => (
                <option key={med._id} value={med._id}>
                  {med.medicine_name} ({med.batch_number})
                </option>
              ))}
            </select>
          )}
        </div>
        
        {forecastData && (
          <div className="flex items-center gap-6 text-xs text-on-surface-variant font-semibold bg-surface-container px-6 py-3 rounded-xl border border-outline-variant">
            <div>
              <span className="text-[10px] text-on-surface-variant block">CURRENT STOCK</span>
              <span className="text-on-surface font-extrabold text-sm">{forecastData.current_stock} units</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant block">BASE SALES RATE</span>
              <span className="text-on-surface font-extrabold text-sm">{forecastData.monthly_sales}/mo</span>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant block">CATEGORY</span>
              <span className="text-primary font-extrabold text-sm">{forecastData.category}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Forecast Visual Display */}
      {loadingForecast ? (
        <div className="card-level-1 p-32 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="card-level-1 p-8 text-center text-error text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-error" /> {error}
        </div>
      ) : forecastData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recharts chart (Left 2 cols) */}
          <div className="card-level-2 p-6 lg:col-span-2 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider">Demand Projections for {forecastData.medicine_name}</h3>
              <span className="chip-stable">
                Seasonality Weighted
              </span>
            </div>
            
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData.forecast_data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7eeff" />
                  <XAxis dataKey="month" stroke="#737784" fontSize={11} />
                  <YAxis stroke="#737784" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderColor: "#c3c6d5", color: "#111c2c", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", color: "#434653" }} />
                  {/* Reference line showing current stock for context */}
                  <ReferenceLine y={forecastData.current_stock} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Current Stock', fill: '#f59e0b', fontSize: 10, position: 'top' }} />
                  <Line type="monotone" dataKey="historical" name="Historical Sales" stroke="#434653" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="forecast" name="Forecast Demand" stroke="#006970" strokeWidth={2.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Statistical Breakdown details card (Right 1 col) */}
          <div className="card-level-2 p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-on-surface font-bold text-sm uppercase tracking-wider border-b border-outline-variant pb-2">Forecast Insights</h3>
              
              <div className="space-y-4">
                {/* Demand Forecast Stat */}
                <div>
                  <span className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wide">Next Month Forecast</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-on-surface">
                      {forecastData.forecast_data.find(d => d.forecast !== null)?.forecast || "N/A"} units
                    </span>
                    <span className="text-stable font-bold text-xs flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Normal range
                    </span>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl space-y-2">
                  <h4 className="text-[10px] text-primary font-bold uppercase tracking-wider">AI Stock Assessment</h4>
                  <p className="text-xs text-on-surface font-medium leading-relaxed">
                    {forecastData.current_stock < (forecastData.monthly_sales * 1.5) ? (
                      "Current stock levels are low relative to projected monthly demand. Initiating procurement reorder recommendation."
                    ) : (
                      "Stock levels are adequate to cover upcoming demand. No procurement order is currently required."
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-outline-variant text-[10px] text-on-surface-variant font-semibold flex items-center gap-1.5 mt-4">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Seasonality estimates are updated monthly.</span>
            </div>
          </div>

        </div>
      ) : (
        <div className="card-level-1 p-16 text-center text-on-surface-variant text-xs">
          Select a medicine to evaluate demand.
        </div>
      )}

    </div>
  );
};

export default DemandForecast;
