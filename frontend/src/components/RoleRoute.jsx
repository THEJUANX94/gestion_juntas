import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Asegúrate de importar useAuth

const RoleRoute = ({ allowedRoles }) => {
  // Desestructuramos isLoading (tal como se llama en tu context) y user
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando permisos...</div>;
  }

  // Si no hay usuario logueado, mandar al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // IMPORTANTE: Asegúrate de que tu backend envía "rol" (minúscula o mayúscula según tu DB)
  // Si en tu base de datos es "IDRol" o "Role", cámbialo aquí: user.IDRol
  if (allowedRoles.includes(user.rol)) {
    return <Outlet />;
  }

  // Si no tiene permiso, lo mandamos al inicio o a una página de 403
  return <Navigate to="/" replace />;
};

export default RoleRoute;