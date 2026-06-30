import { useState, useContext, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { Lock, Mail, Eye, EyeOff, ShieldAlert } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [uiError, setUiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  const from = location.state?.from?.pathname || "/";
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setUiError("Please fill in all fields.");
      return;
    }
    
    setUiError("");
    setIsSubmitting(true);
    
    const result = await login(email, password);
    setIsSubmitting(false);
    
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setUiError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background radial glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,60,144,0.05),transparent_50%)] pointer-events-none"></div>
      
      <div className="w-full max-w-md card-level-2 p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-3xl mb-4">
            🛡️
          </div>
          <h2 className="text-2xl font-bold font-display text-on-surface tracking-wide">Welcome to CareWise</h2>
          <p className="text-on-surface-variant text-sm mt-1.5 font-medium">AI-Powered Drug Expiry Intelligence Platform</p>
        </div>

        {/* Error Alert Box */}
        {uiError && (
          <div className="mb-5 p-4 bg-error-container border border-error/20 text-on-error-container rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uiError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-on-surface font-bold text-xs uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="pharmacist@carewise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-on-surface font-bold text-xs uppercase tracking-wider">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg shadow-level-1 transition-all focus:outline-none active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Signing In...
              </span>
            ) : (
              "Sign In to Platform"
            )}
          </button>
        </form>

        {/* Demo Credentials Alert Note */}
        <div className="mt-6 p-4 bg-surface-container-low rounded-lg border border-outline-variant text-center">
          <p className="text-[11px] text-on-surface-variant font-semibold uppercase tracking-wider mb-2">Demo Credentials</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2 rounded-lg border border-outline-variant text-left">
              <span className="text-[10px] text-primary block font-bold">ADMIN ROLE</span>
              <span className="font-semibold text-on-surface">admin@carewise.com</span>
              <span className="text-on-surface-variant block mt-0.5">pass: admin123</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-outline-variant text-left">
              <span className="text-[10px] text-secondary block font-bold">PHARMACIST ROLE</span>
              <span className="font-semibold text-on-surface">pharmacist@carewise.com</span>
              <span className="text-on-surface-variant block mt-0.5">pass: pharmacy123</span>
            </div>
          </div>
        </div>

        {/* Register footer link */}
        <div className="text-center mt-6 text-xs text-on-surface-variant font-semibold">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline">
            Register store manager
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
