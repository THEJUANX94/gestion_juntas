import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando permisos...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificamos si el rol del usuario está permitido
  if (allowedRoles.includes(user.IDRol)) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default RoleRoute;