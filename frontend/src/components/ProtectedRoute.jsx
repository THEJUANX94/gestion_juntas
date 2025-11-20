import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Usa tu hook de contexto

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        // Muestra un cargador mientras verifica la sesión con el backend
        return <div className="text-center p-10">Verificando sesión...</div>; 
    }

    // 🛑 Bloquea el acceso si no está autenticado
    if (!isAuthenticated) {
        // Redirige al login. El usuario NUNCA verá el layout principal sin login.
        return <Navigate to="/login" replace />; 
    }

    // Permite el acceso al layout principal y sus páginas internas
    return <Outlet />;
};