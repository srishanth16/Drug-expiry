import { useState, useEffect, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { 
  Plus, Search, Edit2, Trash2, 
  RotateCcw, Sparkles, AlertCircle, X 
} from "lucide-react";
import { Link } from "react-router-dom";

const CATEGORIES = ["Analgesic", "Antibiotic", "Cardiovascular", "Dermatological", "Vitamins", "General"];

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMed, setCurrentMed] = useState(null); // Null for Add, Document object for Edit
  
  // Form State
  const [formData, setFormData] = useState({
    medicine_name: "",
    generic_name: "",
    category: "General",
    batch_number: "",
    supplier: "",
    manufacturing_date: "",
    expiry_date: "",
    quantity: 0,
    monthly_sales: 0,
    purchase_price: 0.0,
    selling_price: 0.0
  });
  const [formError, setFormError] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch inventory data
  const fetchInventory = () => {
    setLoading(true);
    api.get(`/inventory?search=${debouncedSearch}&category=${category}`)
      .then((res) => {
        setItems(res.data);
        setError("");
      })
      .catch((err) => {
        setError("Could not load inventory items.");
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, [debouncedSearch, category]);

  // Open modal for adding a new medicine
  const handleOpenAdd = () => {
    setCurrentMed(null);
    setFormData({
      medicine_name: "",
      generic_name: "",
      category: "General",
      batch_number: "",
      supplier: "",
      manufacturing_date: "",
      expiry_date: "",
      quantity: 50,
      monthly_sales: 15,
      purchase_price: 10.0,
      selling_price: 15.0
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for editing an existing medicine
  const handleOpenEdit = (med) => {
    setCurrentMed(med);
    setFormData({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || "",
      category: med.category || "General",
      batch_number: med.batch_number || "",
      supplier: med.supplier || "",
      manufacturing_date: med.manufacturing_date || "",
      expiry_date: med.expiry_date || "",
      quantity: med.quantity,
      monthly_sales: med.monthly_sales,
      purchase_price: med.purchase_price,
      selling_price: med.selling_price
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.medicine_name || !formData.expiry_date || !formData.batch_number) {
      setFormError("Medicine Name, Batch Number, and Expiry Date are required.");
      return;
    }

    try {
      if (currentMed) {
        // Edit Mode
        const res = await api.put(`/inventory/${currentMed._id}`, formData);
        setItems(items.map(i => i._id === currentMed._id ? res.data.medicine : i));
      } else {
        // Add Mode
        const res = await api.post("/inventory", formData);
        setItems([res.data.medicine, ...items]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || "Operation failed.");
    }
  };

  // Delete inventory item
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine?")) return;
    
    try {
      await api.delete(`/inventory/${id}`);
      setItems(items.filter(item => item._id !== id));
    } catch (err) {
      alert("Failed to delete medicine.");
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">Medicine Database</h1>
          <p className="text-on-surface-variant text-xs mt-1 font-semibold">
            Track product batches, quantities, values, and expiry details.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-sm font-bold shadow-level-1 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add New Medicine
        </button>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 card-level-1 p-4 rounded-xl border-outline-variant">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, generic description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-all text-xs"
          />
        </div>

        {/* Category select */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-all text-xs appearance-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Clear Filters */}
        <button
          onClick={() => { setSearch(""); setCategory(""); }}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-lg text-xs font-bold transition-all active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="card-level-2 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-error text-sm">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant text-xs font-semibold">
            No medicines found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant border-b border-outline-variant uppercase tracking-wider font-bold">
                  <th className="py-4 px-6">Medicine & Batch</th>
                  <th className="py-4 px-4">Generic Name</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4 text-center">Stock</th>
                  <th className="py-4 px-4 text-center">Sales/mo</th>
                  <th className="py-4 px-4 text-right">Selling Price</th>
                  <th className="py-4 px-4 text-center">Expiry Date</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/50 text-on-surface">
                {items.map((item) => {
                  const daysToExpiry = Math.ceil((new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpired = daysToExpiry <= 0;
                  const isNearExpiry = daysToExpiry > 0 && daysToExpiry < 120;
                  
                  return (
                    <tr key={item._id} className="hover:bg-surface-container-lowest transition-colors">
                      {/* Name & Batch */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-on-surface text-sm">{item.medicine_name}</div>
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-bold uppercase tracking-wider mt-1 inline-block">
                          {item.batch_number}
                        </span>
                      </td>

                      {/* Generic Name */}
                      <td className="py-4 px-4 font-medium">{item.generic_name || "N/A"}</td>

                      {/* Category */}
                      <td className="py-4 px-4 font-semibold text-on-surface-variant">{item.category}</td>

                      {/* Stock qty */}
                      <td className="py-4 px-4 text-center font-bold">
                        <span className={item.quantity <= 20 ? "text-warning" : "text-on-surface"}>
                          {item.quantity} units
                        </span>
                      </td>

                      {/* Sales per month */}
                      <td className="py-4 px-4 text-center font-medium">{item.monthly_sales} units</td>

                      {/* Selling Price */}
                      <td className="py-4 px-4 text-right font-black text-on-surface">${item.selling_price.toFixed(2)}</td>

                      {/* Expiry Date */}
                      <td className="py-4 px-4 text-center">
                        {isExpired ? (
                          <span className="chip-critical">
                            Expired
                          </span>
                        ) : isNearExpiry ? (
                          <span className="chip-medium" title={`${daysToExpiry} days left`}>
                            Near Expiry
                          </span>
                        ) : (
                          <span className="text-on-surface-variant font-medium">
                            {item.expiry_date}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to="/risk"
                            className="p-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-primary rounded hover:text-primary transition-all"
                            title="Evaluate Risk"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-outline hover:text-primary rounded transition-all"
                            title="Edit Medicine"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 bg-surface-container hover:bg-error-container border border-outline-variant text-outline hover:text-error rounded transition-all"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Slide-Over Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl card-level-2 p-6 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 hover:bg-surface-container-high rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black font-display text-on-surface mb-6 uppercase tracking-wider">
              {currentMed ? "Edit Medicine Record" : "Add Medicine to Stock"}
            </h3>

            {formError && (
              <div className="mb-4 p-3.5 bg-error-container border border-error/20 text-on-error-container rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Medicine name */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Medicine Name</label>
                  <input
                    type="text"
                    required
                    value={formData.medicine_name}
                    onChange={(e) => setFormData({...formData, medicine_name: e.target.value})}
                    placeholder="Crocin 650"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Generic name */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Generic Name</label>
                  <input
                    type="text"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({...formData, generic_name: e.target.value})}
                    placeholder="Paracetamol"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all appearance-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Batch Number */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Batch Number</label>
                  <input
                    type="text"
                    required
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="BATCH123"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Supplier */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    placeholder="Acme Pharma Corp"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    placeholder="100"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Monthly Sales */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Monthly Sales rate</label>
                  <input
                    type="number"
                    value={formData.monthly_sales}
                    onChange={(e) => setFormData({...formData, monthly_sales: parseInt(e.target.value) || 0})}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Purchase Price */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Purchase Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0.0})}
                    placeholder="8.50"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Selling Price */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0.0})}
                    placeholder="12.00"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Manufacturing Date */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Manufacturing Date</label>
                  <input
                    type="date"
                    value={formData.manufacturing_date}
                    onChange={(e) => setFormData({...formData, manufacturing_date: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="text-on-surface-variant font-bold text-[10px] uppercase tracking-wide">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-on-surface text-xs focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-level-1 transition-all"
                >
                  {currentMed ? "Save Changes" : "Save Medicine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
