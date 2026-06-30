import { useState } from "react";
import api from "../services/api";
import { 
  Scan, Upload, Sparkles, Check, Play, Edit, Trash2, 
  HelpCircle, AlertCircle, ArrowRight, ShieldCheck 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const OCRScanner = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsedItems, setParsedItems] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");
  const [ocrMethod, setOcrMethod] = useState("");

  const navigate = useNavigate();

  // Handle image drag & drop / select
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setParsedItems([]);
      setError("");
      setImportSuccess("");
    }
  };

  // Submit file to backend for OCR scanning
  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setError("");
    setImportSuccess("");
    setOcrMethod("");
    
    const formData = new FormData();
    formData.append("invoice", selectedFile);

    try {
      const res = await api.post("/ocr/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setParsedItems(res.data.items || []);
      setOcrMethod(res.data.method || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to scan invoice image.");
    } finally {
      setLoading(false);
    }
  };

  // Edit fields inline in our preview list
  const handleFieldChange = (index, field, value) => {
    const updated = [...parsedItems];
    updated[index] = { ...updated[index], [field]: value };
    setParsedItems(updated);
  };

  // Remove item from preview list
  const handleRemoveItem = (index) => {
    setParsedItems(parsedItems.filter((_, idx) => idx !== index));
  };

  // Commit approved parsed list items to the inventory database
  const handleImportToInventory = async () => {
    if (parsedItems.length === 0) return;
    
    setImporting(true);
    setImportSuccess("");
    setError("");

    let successCount = 0;
    let failMsgs = [];

    // Import items sequentially (or concurrently, but sequential keeps backend logs cleaner)
    for (const item of parsedItems) {
      try {
        await api.post("/inventory", item);
        successCount++;
      } catch (err) {
        failMsgs.push(`${item.medicine_name}: ${err.response?.data?.message || "Failed"}`);
      }
    }

    setImporting(false);
    if (successCount > 0) {
      setImportSuccess(`Successfully imported ${successCount} medicines into your database!`);
      setParsedItems([]);
      setSelectedFile(null);
      setPreviewUrl(null);
      
      // Auto redirect to inventory after a delay
      setTimeout(() => {
        navigate("/inventory");
      }, 2000);
    }
    
    if (failMsgs.length > 0) {
      setError(`Import errors:\n${failMsgs.join("\n")}`);
    }
  };

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black font-display text-on-surface tracking-wide">OCR Invoice Scanner</h1>
        <p className="text-on-surface-variant text-xs mt-1 font-semibold">
          Digitize invoice documentation instantly using Gemini Vision OCR algorithms. Automatically extracts names, batch codes, quantities, and dates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Column (Left 1 col) */}
        <div className="space-y-4">
          <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Upload Invoice Image</h3>
          <div className="card-level-1 p-6 flex flex-col items-center shadow-sm">
            
            <form onSubmit={handleScanSubmit} className="w-full space-y-5">
              {/* Uploader Box */}
              <div className="relative border-2 border-dashed border-outline hover:border-primary rounded-2xl p-6 text-center cursor-pointer transition-all bg-surface-container">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                
                {previewUrl ? (
                  <img src={previewUrl} alt="Invoice preview" className="max-h-56 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="space-y-3 py-6">
                    <Upload className="w-10 h-10 text-outline mx-auto" />
                    <div>
                      <span className="text-on-surface text-xs font-bold block">Select or Drop Invoice Image</span>
                      <span className="text-on-surface-variant text-[10px] block mt-0.5">JPEG, PNG up to 5MB</span>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFile || loading}
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold shadow-level-1 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Running OCR Parser...
                  </span>
                ) : (
                  <>
                    <Scan className="w-4 h-4" /> Start Invoice Scan
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 text-[10px] text-on-surface-variant font-semibold leading-relaxed text-left flex items-start gap-1.5 p-3.5 bg-surface-container-low rounded-xl border border-outline-variant w-full">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <span>
                Tip: Ensure text is clear, flat, and well-lit. The engine will extract medicine details and categorize them automatically.
              </span>
            </div>

          </div>
        </div>

        {/* Preview & Edit list Column (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Extracted Inventory Preview</h3>
            {ocrMethod && (
              <div className="text-[10px] px-2 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold">
                {ocrMethod}
              </div>
            )}
          </div>
          
          {error && (
            <div className="p-4 bg-error-container border border-error/20 text-error text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-pre-line">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {importSuccess && (
            <div className="p-4 bg-stable/10 border border-stable/20 text-stable text-xs font-semibold rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Info note about OCR methods */}
          <div className="p-4 bg-surface-container border border-outline-variant text-on-surface text-[10px] font-semibold rounded-xl">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p><strong>How to enable real OCR:</strong></p>
                <p>1. Get a free Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google AI Studio</a></p>
                <p>2. Add it to <code className="bg-surface-container-highest px-1.5 py-0.5 rounded">backend/.env</code> as <code className="bg-surface-container-highest px-1.5 py-0.5 rounded">GEMINI_API_KEY=your-key-here</code></p>
                <p>3. Restart the backend server</p>
                <p className="mt-2 text-on-surface-variant">Currently using demo mock data for preview purposes.</p>
              </div>
            </div>
          </div>

          {parsedItems.length === 0 ? (
            <div className="card-level-1 p-24 text-center text-on-surface-variant text-xs font-bold">
              No scanned items to preview yet. Upload an invoice to begin.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Parsed list grid */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {parsedItems.map((item, idx) => (
                  <div key={idx} className="card-level-2 p-5 space-y-4 relative">
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute top-4 right-4 text-outline hover:text-error transition-all"
                      title="Discard Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <h4 className="text-on-surface font-extrabold text-xs uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Item #{idx + 1}
                    </h4>

                    {/* Form fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Medicine Name</label>
                        <input
                          type="text"
                          value={item.medicine_name}
                          onChange={(e) => handleFieldChange(idx, "medicine_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Generic Name</label>
                        <input
                          type="text"
                          value={item.generic_name}
                          onChange={(e) => handleFieldChange(idx, "generic_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Batch Number</label>
                        <input
                          type="text"
                          value={item.batch_number}
                          onChange={(e) => handleFieldChange(idx, "batch_number", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleFieldChange(idx, "quantity", parseInt(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Selling Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_price}
                          onChange={(e) => handleFieldChange(idx, "selling_price", parseFloat(e.target.value) || 0.0)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-outline uppercase">Expiry Date</label>
                        <input
                          type="date"
                          value={item.expiry_date}
                          onChange={(e) => handleFieldChange(idx, "expiry_date", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Button */}
              <button
                onClick={handleImportToInventory}
                disabled={importing || parsedItems.length === 0}
                className="w-full py-3.5 bg-secondary hover:bg-secondary-container text-on-secondary rounded-xl font-bold shadow-level-1 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {importing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Importing to stock database...
                  </span>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Import {parsedItems.length} Scanned Medicines
                  </>
                )}
              </button>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default OCRScanner;
