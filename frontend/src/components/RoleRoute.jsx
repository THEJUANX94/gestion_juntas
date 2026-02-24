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

  // Normalize `allowedRoles` to an array and guard against undefined
  const allowed = Array.isArray(allowedRoles)
    ? allowedRoles
    : (allowedRoles != null ? [allowedRoles] : []);

  // Use loose equality so numbers/strings compare correctly
  const hasAccess = allowed.some((role) => role == user?.IDRol);

  if (hasAccess) {
    return <Outlet />;
  }

  return <Navigate to="/" replace />;
};

export default RoleRoute;