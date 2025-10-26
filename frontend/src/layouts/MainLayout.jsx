import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  Bell,
  User,
  Users,
  List,
  UserPlus,
  LogOut,
  Building2,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [logo, setLogo] = useState(localStorage.getItem("logo") || "/logo.png");
  const [collapsed, setCollapsed] = useState(false);
  const [juntasOpen, setJuntasOpen] = useState(true);
  const [usuariosOpen, setUsuariosOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setLogo(localStorage.getItem("logo") || "/logo.png");
    };
    const handleLogoChanged = (e) => setLogo(e.detail);
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("logoChanged", handleLogoChanged);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("logoChanged", handleLogoChanged);
    };
  }, []);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-green-50 font-semibold text-green-800 border-l-4 border-green-700"
      : "text-gray-700 hover:bg-gray-100 hover:text-green-800";

  const handleLogout = async () => {
    try {
      await fetch(import.meta.env.VITE_PATH + "/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      logout();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-[Poppins]">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-20 border-b border-gray-200">
        <div className="flex justify-between items-center px-10 py-4">
          {/* Logo + título */}
          <div className="flex items-center gap-4">
            <img src={logo} alt="Logo" className="h-14 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
                Gobernación de Boyacá
              </h1>
              <p className="text-sm text-gray-600 tracking-wide">
                Gestión de Juntas de Acción Comunal
              </p>
            </div>
          </div>

          {/* Navbar con iconos */}
          <nav className="flex items-center gap-6 relative">
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              title="Notificaciones"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              title="Ayuda"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigate("/configuracion")}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Menú de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-700"
                title="Usuario"
              >
                <User className="h-5 w-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-50 py-2">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm text-gray-700 font-semibold">
                      {user?.nombre || "Usuario desconocido"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.correo || ""}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition"
                  >
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <aside
          className={`${
            collapsed ? "w-20" : "w-64"
          } transition-all duration-300 border-r shadow-sm bg-white`}
        >
          <nav className="p-4 space-y-6">
            {/* Sección: Gestión de Juntas */}
            <div>
              {!collapsed && (
                <h2 className="font-semibold mb-2 text-gray-600 uppercase text-sm tracking-wide">
                  Gestión de Juntas
                </h2>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/juntas/crear"
                    className={`flex items-center gap-3 px-3 py-2 rounded ${isActive(
                      "/juntas/crear"
                    )}`}
                  >
                    <Building2 className="h-5 w-5" />
                    {!collapsed && "Crear Junta"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/juntas/consultar"
                    className={`flex items-center gap-3 px-3 py-2 rounded ${isActive(
                      "/juntas/consultar"
                    )}`}
                  >
                    <List className="h-5 w-5" />
                    {!collapsed && "Consultar Juntas"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sección: Gestión de Usuarios */}
            <div>
              {!collapsed && (
                <h2 className="font-semibold mb-2 text-gray-600 uppercase text-sm tracking-wide">
                  Gestión de Usuarios
                </h2>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/usuarios/crear"
                    className={`flex items-center gap-3 px-3 py-2 rounded ${isActive(
                      "/usuarios/crear"
                    )}`}
                  >
                    <UserPlus className="h-5 w-5" />
                    {!collapsed && "Crear Usuario"}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/usuarios/listar"
                    className={`flex items-center gap-3 px-3 py-2 rounded ${isActive(
                      "/usuarios/listar"
                    )}`}
                  >
                    <Users className="h-5 w-5" />
                    {!collapsed && "Listar Usuarios"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Sección: Configuración */}
            <div>
              {!collapsed && (
                <h2 className="font-semibold mb-2 text-gray-600 uppercase text-sm tracking-wide">
                  Configuración
                </h2>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/configuracion"
                    className={`flex items-center gap-3 px-3 py-2 rounded ${isActive(
                      "/configuracion"
                    )}`}
                  >
                    <Settings className="h-5 w-5" />
                    {!collapsed && "Configuración General"}
                  </Link>
                </li>
              </ul>
            </div>
          </nav>

          {/* Botón colapsar */}
          <div className="flex justify-end p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded hover:bg-gray-100 text-gray-600"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </aside>

        {/* CONTENIDO CENTRAL */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
