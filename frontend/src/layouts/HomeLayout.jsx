import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../components/ui/Footer";

export default function HomeLayout() {
  const location = useLocation();
  const [logo, setLogo] = useState(localStorage.getItem("logo") || "/logo.png");

  useEffect(() => {
    const handleStorageChange = () => {
      setLogo(localStorage.getItem("logo") || "/logo.png");
    };

    const handleLogoChanged = (e) => {
      setLogo(e.detail);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("logoChanged", handleLogoChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("logoChanged", handleLogoChanged);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white via-[#f9fafb] to-[#f0f4f1] font-[Poppins]">
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
                Gestión de Juntas
              </p>
            </div>
          </div>

          {/* Navbar */}
          <nav className="flex items-center gap-8">
            <Link
              to="/certificado"
              className={`font-semibold text-lg transition-colors duration-200 ${location.pathname === "/solicitarCertificado"
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-800"
                }`}
            >
              Solicitar Certificado
            </Link>
            <Link
              to="/"
              className={`font-semibold text-lg transition-colors duration-200 ${location.pathname === "/"
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-800"
                }`}
            >
              Inicio
            </Link>
            <Link
              to="/login"
              className={`font-semibold text-lg transition-colors duration-200 ${location.pathname === "/login"
                  ? "text-green-700"
                  : "text-gray-700 hover:text-green-800"
                }`}
            >
              Iniciar Sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 px-8 md:px-16 py-10">
        <Outlet />
        <Footer />
      </main>

    </div>
  );
}
