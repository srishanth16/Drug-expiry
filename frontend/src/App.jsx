import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

// Pages import
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import ExpiryRisk from "./pages/ExpiryRisk";
import DemandForecast from "./pages/DemandForecast";
import Procurement from "./pages/Procurement";
import OCRScanner from "./pages/OCRScanner";
import SimilaritySearch from "./pages/SimilaritySearch";
import AIChat from "./pages/AIChat";

// Main layout wrapper for protected views
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface flex">
      {/* Side navigation */}
      <Sidebar />
      
      {/* Right panel side container */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <Navbar />
        
        {/* Main page content container */}
        <main className="flex-1 ml-64 p-4 text-on-surface overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Inventory />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/risk"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ExpiryRisk />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DemandForecast />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Procurement />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ocr"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <OCRScanner />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/similarity"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <SimilaritySearch />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AIChat />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirection fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
