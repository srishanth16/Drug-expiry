import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { User, Lock, Mail, ShieldAlert, Award } from "lucide-react";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Pharmacist");
  const [uiError, setUiError] = useState("");
  const [uiSuccess, setUiSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setUiError("Please fill in all fields.");
      return;
    }

    setUiError("");
    setUiSuccess("");
    setIsSubmitting(true);

    const result = await register(name, email, password, role);
    setIsSubmitting(false);

    if (result.success) {
      setUiSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } else {
      setUiError(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,60,144,0.05),transparent_50%)] pointer-events-none"></div>

      <div className="w-full max-w-md card-level-2 p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-3xl mb-4">
            🛡️
          </div>
          <h2 className="text-2xl font-bold font-display text-on-surface tracking-wide">Join CareWise</h2>
          <p className="text-on-surface-variant text-sm mt-1.5 font-medium">Create your pharmacy admin account</p>
        </div>

        {/* Error Alert Box */}
        {uiError && (
          <div className="mb-5 p-4 bg-error-container border border-error/20 text-on-error-container rounded-xl flex items-start gap-2.5 text-xs font-semibold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{uiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-on-surface font-bold text-xs uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-on-surface font-bold text-xs uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="admin@pharmacy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-on-surface font-bold text-xs uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-outline-variant rounded-lg text-on-surface placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm"
                required
              />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-on-surface font-bold text-xs uppercase tracking-wider">System Access Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-medium text-sm appearance-none"
            >
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">System Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold rounded-lg shadow-level-1 transition-all focus:outline-none active:scale-[0.99] disabled:opacity-50 mt-4"
          >
            {isSubmitting ? "Creating Account..." : "Register Account"}
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-on-surface-variant font-semibold">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
