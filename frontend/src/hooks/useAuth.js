import { useAuth } from "../context/AuthContext";

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (allowedRoles) => {
    if (!user) return false;
    return allowedRoles.includes(user.rol_id);
  };

  return { hasPermission };
};
