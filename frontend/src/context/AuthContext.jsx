import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProviderContent = ({ children, navigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const login = () => {
    setIsAuthenticated(true);
    navigate("/asistencia", { replace: true });
  };

  const logout = async () => {
    try {
      await fetch(import.meta.env.VITE_PATH + "/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Error cerrando sesión:", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      navigate("/login", { replace: true });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(import.meta.env.VITE_PATH + "/auth/verify", {
          method: "GET",
          credentials: "include", 
        });

        if (!res.ok) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const data = await res.json();

        if (data.valid) {
          setIsAuthenticated(true);
          setUser(data.user); 
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Fallo la verificación de sesión:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, isLoading, user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  return (
    <AuthProviderContent navigate={navigate}>{children}</AuthProviderContent>
  );
};

export const useAuth = () => useContext(AuthContext);
