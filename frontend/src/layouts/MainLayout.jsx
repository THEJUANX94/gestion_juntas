import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  HelpCircle,
  Bell,
  User,
  Home,
  Users,
  List,
  UserPlus,
  LogOut,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext"; 

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 
  const [logo, setLogo] = useState(localStorage.getItem("logo") || "/logo.png");
  const [collapsed, setCollapsed] = useState(false);
  const [personasOpen, setPersonasOpen] = useState(false);
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
      ? "bg-gray-200 font-semibold text-[var(--color-hover-text)]"
      : "";

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
      navigate("/login_user", { replace: true });
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background-page)" }}
    >
      {/* Header */}
      <header
        className="bg-gradient-to-r shadow-md"
        style={{ backgroundColor: "var(--color-background-upper)" }}
      >
        <div className="flex justify-between items-center px-8 py-3">
          {/* Logo + título */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-16 w-auto" />
            <h1
              className="text-xl font-bold tracking-wide"
              style={{ color: "var(--color-text-color-upper)" }}
            >
              Gobernación de Boyacá
            </h1>
          </div>

          {/* Navbar con iconos */}
          <nav className="flex items-center gap-6 relative">
            <button className="p-2 rounded-full hover:bg-[var(--color-hover-bg)] text-[var(--color-text-color-upper)]">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-[var(--color-hover-bg)] text-[var(--color-text-color-upper)]">
              <HelpCircle className="h-5 w-5" />
            </button>

            {/* Botón de configuración */}
            <button
              onClick={() => navigate("/configuracion")}
              className="p-2 rounded-full hover:bg-[var(--color-hover-bg)] text-[var(--color-text-color-upper)]"
              title="Configuración"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Menú de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="p-2 rounded-full hover:bg-[var(--color-hover-bg)] text-[var(--color-text-color-upper)]"
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

      {/* Layout principal */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`${
            collapsed ? "w-20" : "w-64"
          } transition-all duration-300 border-r shadow-sm`}
          style={{ backgroundColor: "var(--color-background-sidebar)" }}
        >
          <nav className="p-4 space-y-4">
            <div>
              {!collapsed && (
                <h2 className="font-semibold mb-3 uppercase tracking-wide text-[var(--color-text-color-sidebar-pr)]">
                  Menú principal
                </h2>
              )}
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/asistencia"
                    title="Asistencia"
                    className={`flex items-center gap-3 px-3 py-2 rounded
                      text-[var(--color-text-color-sidebar-sec)]
                      hover:bg-[var(--color-hover-bg)]
                      hover:text-[var(--color-hover-text)] ${isActive(
                        "/asistencia"
                      )}`}
                  >
                    <Home className="h-5 w-5" />
                    {!collapsed && "Asistencia"}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Administración */}
            {!collapsed && (
              <h2 className="font-semibold mb-3 uppercase tracking-wide text-[var(--color-text-color-sidebar-pr)]">
                Administración
              </h2>
            )}
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setPersonasOpen(!personasOpen)}
                  title="Personas"
                  className={`flex items-center w-full gap-3 px-3 py-2 rounded
                    text-[var(--color-text-color-sidebar-sec)]
                    hover:bg-[var(--color-hover-bg)]
                    hover:text-[var(--color-hover-text)]`}
                >
                  <Users className="h-5 w-5" />
                  {!collapsed && "Personas"}
                </button>

                {(personasOpen || !collapsed) && (
                  <ul
                    className={`${collapsed ? "pl-0" : "ml-6"} mt-1 space-y-1`}
                  >
                    <li>
                      <Link
                        to="/usuarios/creacion"
                        title="Crear Persona"
                        className={`flex items-center gap-2 px-3 py-2 rounded
                          text-[var(--color-text-color-sidebar-sec)]
                          hover:bg-[var(--color-hover-bg)]
                          hover:text-[var(--color-hover-text)] ${isActive(
                            "/usuarios/creacion"
                          )}`}
                      >
                        <UserPlus className="h-5 w-5" />
                        {!collapsed && "Crear Persona"}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/usuarios/listar"
                        title="Listar Personas"
                        className={`flex items-center gap-2 px-3 py-2 rounded
                          text-[var(--color-text-color-sidebar-sec)]
                          hover:bg-[var(--color-hover-bg)]
                          hover:text-[var(--color-hover-text)] ${isActive(
                            "/usuarios/listar"
                          )}`}
                      >
                        <List className="h-5 w-5" />
                        {!collapsed && "Listar Personas"}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>

            {/* Configuración */}
            {!collapsed && (
              <h2 className="font-semibold mb-3 uppercase tracking-wide text-[var(--color-text-color-sidebar-pr)]">
                Ajustes
              </h2>
            )}
            <ul className="space-y-1">
              <li>
                <Link
                  to="/configuracion"
                  title="Configuración"
                  className={`flex items-center gap-3 px-3 py-2 rounded
                      text-[var(--color-text-color-sidebar-sec)]
                      hover:bg-[var(--color-hover-bg)]
                      hover:text-[var(--color-hover-text)] ${isActive(
                        "/configuracion"
                      )}`}
                >
                  <Settings className="h-5 w-5" />
                  {!collapsed && "Configuración"}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Botón colapsar/expandir */}
          <div className="flex justify-end p-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded hover:bg-[var(--color-hover-bg)]"
            >
              {collapsed ? "»" : "«"}
            </button>
          </div>
        </aside>

        {/* Zona de contenido dinámico */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
