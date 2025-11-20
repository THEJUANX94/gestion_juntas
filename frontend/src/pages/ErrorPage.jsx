import { useNavigate } from "react-router-dom";
import { AlertTriangle, Home } from "lucide-react";

export default function ErrorPage() {
  const navigate = useNavigate();

  return (
    <div
      className="flex flex-col items-center justify-center h-screen text-center px-6"
      style={{
        backgroundColor: "var(--color-background-table)",
        color: "var(--color-text-color-page)",
      }}
    >
      {/* Icono de error */}
      <div className="animate-bounce mb-6">
        <AlertTriangle size={80} className="text-red-500" />
      </div>

      {/* Título principal */}
      <h1 className="text-6xl font-bold mb-3">404</h1>
      <h2 className="text-2xl font-semibold mb-4">¡Ups! Página no encontrada</h2>

      {/* Texto descriptivo */}
      <p className="max-w-md mb-8 text-gray-400">
        Parece que la página que intentas visitar no existe o fue movida.  
        Verifica la dirección o regresa al inicio.
      </p>

      {/* Botón volver */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-5 py-2 rounded-md font-medium shadow-md transition-all"
        style={{
          backgroundColor: "var(--color-background-upper)",
          color: "var(--color-text-color-upper)",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--color-hover-bg-table)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor =
            "var(--color-background-upper)")
        }
      >
        <Home className="h-5 w-5" />
        Volver al inicio
      </button>

      {/* Fondo decorativo */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none transform rotate-180 opacity-10 select-none">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="relative block w-[calc(100%+1.3px)] h-[150px]"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86C590.93,1.07,649.73-2.8,708.5,1.14c72.18,4.88,142.36,27.61,214.74,35.42C1023.9,43.4,1113,32.09,1200,24V120H0V48.11C89.09,64.39,222.86,68.14,321.39,56.44Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
    </div>
  );
}
