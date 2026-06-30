import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  ShieldAlert, 
  TrendingUp, 
  ShoppingCart, 
  Scan, 
  SearchCode, 
  MessageSquareCode, 
  LogOut,
  UserCheck
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Inventory", path: "/inventory", icon: Package },
    { name: "Expiry Risk", path: "/risk", icon: ShieldAlert },
    { name: "Demand Forecast", path: "/forecast", icon: TrendingUp },
    { name: "Smart Procurement", path: "/procurement", icon: ShoppingCart },
    { name: "OCR Invoice Scanner", path: "/ocr", icon: Scan },
    { name: "Drug Similarity", path: "/similarity", icon: SearchCode },
    { name: "AI Chat Assistant", path: "/chat", icon: MessageSquareCode },
  ];

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant text-on-surface-variant flex flex-col min-h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-outline-variant gap-3">
        <span className="text-2xl">🛡️</span>
        <div>
          <h1 className="font-bold font-display text-on-surface tracking-wide text-lg leading-none">CareWise</h1>
          <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">Pharmacy Intelligence</span>
        </div>
      </div>

      {/* User Information Profile */}
      <div className="p-4 mx-3 my-4 bg-surface-container rounded-xl border border-outline-variant flex items-center gap-3 shadow-sm">
        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg">
          {user?.name?.[0].toUpperCase() || "U"}
        </div>
        <div className="overflow-hidden">
          <h2 className="text-sm font-semibold text-on-surface truncate leading-tight">{user?.name}</h2>
          <span className="text-[11px] text-outline flex items-center gap-1 font-medium mt-0.5">
            <UserCheck className="w-3 h-3 text-stable" />
            {user?.role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive 
                  ? "bg-primary text-on-primary shadow-level-1" 
                  : "hover:bg-surface-container-high hover:text-primary"
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? "text-on-primary" : "text-outline"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-outline-variant">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-outline hover:bg-error-container hover:text-error transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          Logout Session
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
