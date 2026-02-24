import { useContext } from "react";
import { useAuth as useAuthContext } from "../context/AuthContext"; 

const useAuth = () => {
  const context = useAuthContext();
  
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }

  return context;
};

export default useAuth;