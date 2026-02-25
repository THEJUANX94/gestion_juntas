import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (allowedRoles = []) => {
    const rolUsuario = user?.IDRol;

    if (!rolUsuario) return false;

    return allowedRoles.includes(rolUsuario);
  };

  return { hasPermission };
};