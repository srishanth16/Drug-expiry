import { useState, useEffect } from "react";
import api from "../services/api";
import { 
  ShoppingCart, RefreshCw, BadgeAlert, CheckCircle, 
  ChevronRight, BadgeDollarSign, Truck, FileOutput 
} from "lucide-react";

const Procurement = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leadTime, setLeadTime] = useState(7);
  const [safetyDays, setSafetyDays] = useState(5);

  const fetchRecommendations = () => {
    setLoading(true);
    api.post("/procurement", { lead_time_days: leadTime, safety_stock_days: safetyDays })
      .then((res) => {
        setRecommendations(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Failed to load procurement recommendations.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecommendations();
  }, [leadTime, safetyDays]);

  const reorderList = recommendations.filter(r => r.reorder_needed);
  const totalCost = reorderList.reduce((acc, curr) => acc + curr.estimated_cost, 0);

  const handleCreatePO = () => {
    if (reorderList.length === 0) {
      alert("No items require reordering right now.");
      return;
    }
    alert(`Purchase Order Generated Successfully!\nTotal Items: ${reorderList.length}\nTotal Order Cost: $${totalCost.toFixed(2)}\nSent to primary suppliers.`);
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">Smart Procurement Engine</h1>
          <p className="text-on-surface-variant text-xs mt-1 font-semibold">
            Calculate safety buffers and optimal order values dynamically to prevent stockouts while avoiding over-purchasing capital traps.
          </p>
        </div>
        <button
          onClick={fetchRecommendations}
          className="flex items-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Recompute Quantities
        </button>
      </div>

      {/* ROP Variables Customizer Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 card-level-1 p-5 text-xs font-semibold">
        <div className="space-y-1">
          <label className="text-on-surface-variant uppercase tracking-wide block text-[10px]">Supplier Lead Time (Days)</label>
          <input
            type="number"
            value={leadTime}
            onChange={(e) => setLeadTime(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-on-surface-variant uppercase tracking-wide block text-[10px]">Safety Stock Buffer (Days)</label>
          <input
            type="number"
            value={safetyDays}
            onChange={(e) => setSafetyDays(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-end">
          <div className="text-on-surface-variant text-[10px] bg-surface-container-low p-3 rounded-lg border border-outline-variant w-full leading-relaxed">
            Formula: <code className="text-primary font-bold">ROP = (Daily Sales × Lead Time) + Safety Stock</code>
          </div>
        </div>
      </div>

      {/* Procurement PO Summaries and Orders List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Orders Table (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Restock recommendations</h3>
          
          <div className="card-level-2 rounded-xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-16 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-error text-xs">{error}</div>
            ) : recommendations.length === 0 ? (
              <div className="p-16 text-center text-on-surface-variant text-xs font-semibold">
                No items found in stock database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant uppercase tracking-wider font-bold">
                      <th className="py-4 px-6">Medicine Name</th>
                      <th className="py-4 px-4 text-center">Current Stock</th>
                      <th className="py-4 px-4 text-center">Reorder ROP</th>
                      <th className="py-4 px-4 text-center">Status</th>
                      <th className="py-4 px-4 text-center">Order Qty</th>
                      <th className="py-4 px-6 text-right">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/50 text-on-surface">
                    {recommendations.map((item) => (
                      <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-on-surface text-sm">{item.medicine_name}</div>
                          <span className="text-[10px] text-on-surface-variant font-medium">Supplier: {item.supplier}</span>
                        </td>
                        <td className="py-4 px-4 text-center font-bold">{item.current_stock} units</td>
                        <td className="py-4 px-4 text-center font-semibold text-on-surface-variant">{item.reorder_point} units</td>
                        <td className="py-4 px-4 text-center">
                          {item.reorder_needed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-error-container border border-error/20 text-error rounded-full font-bold uppercase tracking-wider text-[9px]">
                              <BadgeAlert className="w-3 h-3 text-error" /> Reorder
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stable/10 border border-stable/20 text-stable rounded-full font-bold uppercase tracking-wider text-[9px]">
                              <CheckCircle className="w-3 h-3 text-stable" /> Adequate
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center font-black">
                          {item.recommended_order > 0 ? (
                            <span className="text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                              + {item.recommended_order}
                            </span>
                          ) : (
                            <span className="text-outline">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-black text-on-surface">
                          {item.estimated_cost > 0 ? `$${item.estimated_cost.toFixed(2)}` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PO Generation Summary panel (Right 1 col) */}
        <div className="space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Order compilation</h3>
          <div className="card-level-2 p-6 flex flex-col justify-between h-[360px]">
            <div className="space-y-4">
              <h4 className="text-on-surface font-bold text-sm flex items-center gap-1.5 pb-2 border-b border-outline-variant">
                <Truck className="w-4 h-4 text-primary" /> Purchase Order Overview
              </h4>
              
              <div className="space-y-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Total Items to Order:</span>
                  <span className="text-on-surface font-extrabold">{reorderList.length} items</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Lead Time Applied:</span>
                  <span className="text-on-surface font-extrabold">{leadTime} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Safety Buffer:</span>
                  <span className="text-on-surface font-extrabold">{safetyDays} Days Sales</span>
                </div>
                
                <div className="p-4 bg-surface-container border border-outline-variant rounded-xl flex items-center justify-between mt-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wide">Estimated Cost</span>
                    <span className="text-on-surface font-black text-lg">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <BadgeDollarSign className="w-8 h-8 text-stable opacity-80" />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreatePO}
              disabled={reorderList.length === 0}
              className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold shadow-level-1 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              <FileOutput className="w-4 h-4" /> Submit Purchase Order
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Procurement;
