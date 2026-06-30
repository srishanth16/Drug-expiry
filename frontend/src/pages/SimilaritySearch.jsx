import { useState } from "react";
import api from "../services/api";
import { Search, Sparkles, HelpCircle, ArrowRight, ShieldAlert, Award } from "lucide-react";

const SimilaritySearch = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/similarity?name=${encodeURIComponent(query)}`);
      setResult(res.data);
    } catch (err) {
      setError("Failed to locate drug alternatives. Check spelling.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">Drug Similarity Engine</h1>
        <p className="text-on-surface-variant text-xs mt-1 font-semibold">
          Suggest therapeutic drug alternatives using our chemical active ingredient database and dynamic AI matching algorithms.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Search Input (Left 1 col) */}
        <div className="space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Search Alternatives</h3>
          <div className="card-level-1 p-6 space-y-4 shadow-sm">
            
            <form onSubmit={handleSearchSubmit} className="space-y-4 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-on-surface-variant uppercase block text-[10px]">Enter Drug Brand Name</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dolo 650, Mox 500..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl text-on-surface placeholder-outline focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold shadow-level-1 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Searching Database..." : "Find Alternatives"}
              </button>
            </form>

            <div className="text-[10px] text-on-surface-variant font-semibold leading-relaxed p-3.5 bg-surface-container-low rounded-xl border border-outline-variant space-y-1">
              <span className="text-[9px] text-primary font-bold uppercase block">Supported Keywords:</span>
              <p className="text-on-surface-variant">Dolo 650, Crocin 650, Calpol 650, Combiflam, Brufen 400, Mox 500, Azithral 500, Glycomet 500, Atorva 10, Okacet.</p>
              <p className="text-[9px] text-outline block mt-1.5">*Custom drugs will utilize dynamic AI query mapping.</p>
            </div>

          </div>
        </div>

        {/* Alternatives Display Results (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Therapeutic Alternatives</h3>
          
          {loading ? (
            <div className="card-level-2 p-24 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="card-level-2 p-8 text-center text-error text-xs">{error}</div>
          ) : result ? (
            <div className="card-level-2 p-6 space-y-6">
              
              {/* Head Section */}
              <div className="border-b border-outline-variant pb-4 space-y-1">
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-wider">Drug Profile Queried</span>
                <h3 className="text-on-surface font-extrabold text-lg">{result.medicine_name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold pt-2">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase">Active Ingredient</span>
                    <span className="text-on-surface block text-sm font-extrabold mt-0.5">{result.generic_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase">Chemical Class</span>
                    <span className="text-primary block text-sm font-extrabold mt-0.5">{result.category}</span>
                  </div>
                </div>
              </div>

              {/* Alternatives List */}
              <div className="space-y-3">
                <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-wider">Suggested Brand Alternatives</span>
                {result.alternatives.length === 0 ? (
                  <div className="text-xs text-on-surface-variant font-semibold p-4 bg-surface-container rounded-xl border border-outline-variant">
                    No active brand substitutions found in knowledge base or current inventory stock.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.alternatives.map((alt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-6 rounded-lg bg-primary/10 border border-primary/20 text-xs font-black text-primary flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-on-surface">{alt}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-outline" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warning Clinical Advice note */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-xs leading-relaxed font-semibold">
                <ShieldAlert className="w-4 h-4 text-orange-700 shrink-0 mt-0.5" />
                <div>
                  <span className="text-orange-700 block uppercase text-[10px] tracking-wide mb-0.5">Clinical Note & Warning</span>
                  <p className="text-on-surface font-medium">{result.clinical_note}</p>
                </div>
              </div>

            </div>
          ) : (
            <div className="card-level-2 p-20 text-center text-on-surface-variant text-xs font-bold">
              Enter a brand name to retrieve active substitutions.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default SimilaritySearch;
