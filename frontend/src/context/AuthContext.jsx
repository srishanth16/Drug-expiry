import { createContext, useState, useEffect } from "react";
import api from "../services/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user credentials exist in localStorage
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      
      // Optionally verify token with backend
      api.get("/auth/me")
        .then((res) => {
          if (res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      
      setToken(token);
      setUser(user);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const register = async (name, email, password, role) => {
    setError(null);
    try {
      await api.post("/auth/register", { name, email, password, role });
      return { success: true };
    } catch (err) {
      const errMsg = err.response?.data?.message || "Registration failed.";
      setError(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        isAdmin: user?.role === "Admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
