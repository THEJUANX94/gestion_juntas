import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      AlertMessage.info("Campo requerido", "Por favor ingresa tu correo electrónico.");
      setLoading(false);
      return;
    }

    try {
      // Llamada al endpoint de Node.js que creamos
      const response = await fetch(import.meta.env.VITE_PATH + "/login/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error desconocido al solicitar la recuperación.");
      }

      // Éxito: El mensaje del backend está diseñado para ser seguro (no revela si existe)
      AlertMessage.success(
        "Instrucciones Enviadas",
        data.message || "Revisa tu correo electrónico para el enlace de restablecimiento. Si no lo encuentras, revisa tu carpeta de spam."
      );
    } catch (err) {
      console.error("Error al solicitar restablecimiento:", err);
      AlertMessage.error("Error", err.message || "Fallo en la comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 text-white">
      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row flex-grow">
        {/* Lado izquierdo (estático, solo cambia el texto) */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 w-full flex flex-col justify-center items-center text-white p-12"
        >
          {/* ... (Tu logo y encabezado, sin cambios) ... */}
          <img
            src="/logo.png"
            alt="Logo Gobernación de Boyacá"
            className="w-[28rem] h-auto mb-10 drop-shadow-2xl transition-transform duration-500 hover:scale-105"
          />
          <h1 className="text-5xl font-bold text-center leading-tight mb-3">
            Gobernación de Boyacá
            <br />
            <span className="text-3xl font-semibold text-green-100">
              Recuperación de Contraseña
            </span>
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md leading-relaxed">
            Ingresa tu correo electrónico y te enviaremos un enlace para establecer una nueva contraseña.
          </p>
        </motion.div>

        {/* Lado derecho con formulario */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 w-full flex justify-center items-center p-12"
        >
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-lg shadow-2xl rounded-3xl p-12 border border-green-200">
            <h2 className="text-4xl font-bold text-center text-green-800 mb-10">
              Restablecer Acceso
            </h2>

            <form onSubmit={handleForgotPassword} className="space-y-8">
              {/* Campo correo */}
              <div>
                <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                  Correo Electrónico
                </label>
                <div className="flex items-center bg-green-50 border border-green-300 rounded-xl px-5 py-3 focus-within:ring-2 focus-within:ring-green-600 transition-all">
                  <Mail className="text-green-700 mr-3" size={22} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="ejemplo@boyaca.gov.co"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-gray-800 placeholder-green-700/50 text-lg"
                  />
                </div>
              </div>

              {/* Botón */}
              <div className="flex justify-center pt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg rounded-xl font-semibold bg-gradient-to-r from-green-700 to-emerald-500 text-white hover:from-green-800 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Enviando..." : "Enviar Enlace de Restablecimiento"}
                </motion.button>
              </div>

              {/* Enlace para volver */}
              <div className="text-center pt-4">
                <Link 
                  to="/" 
                  className="inline-flex items-center text-green-600 hover:text-green-800 hover:underline transition-colors font-medium"
                >
                  <ArrowLeft size={20} className="mr-1" />
                  Volver al Inicio de Sesión
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      <footer className="bg-black/20 backdrop-blur-sm py-4 text-center text-white text-sm">
        Dirección de Sistemas - Gobernación de Boyacá <br />
        Todos los derechos reservados. <br />
        Copyright © 2025
      </footer>
    </div>
  );
}