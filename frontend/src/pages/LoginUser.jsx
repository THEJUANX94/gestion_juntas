import { useState, useEffect } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom"; // Importar 'Link'

export default function LoginUser() {
  const navigate = useNavigate();
  const { login: contextLogin, isAuthenticated } = useAuth();
  const [captchaToken, setCaptchaToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Redirige al dashboard si ya está logueado
      navigate("/juntas/crear", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (form) => {
    const { login, contraseña } = form;

    if (!captchaToken) {
      AlertMessage.info(
        "Verificación requerida",
        "Por favor completa el reCAPTCHA antes de continuar."
      );
      return;
    }

    try {
      const response = await fetch(import.meta.env.VITE_PATH + "/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, contraseña, captcha: captchaToken }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Credenciales incorrectas o error en el servidor.");
      }

      const data = await response.json();
      console.log("Login exitoso:", data);

      contextLogin();

      AlertMessage.success("Inicio de sesión exitoso", "Bienvenido/a al sistema.");
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      AlertMessage.error("Error de autenticación", "Usuario, contraseña o captcha incorrectos.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 text-white">
      {/* Contenedor principal */}
      <div className="flex flex-col md:flex-row flex-grow">
        {/* Lado izquierdo con logo y texto - SIN CAMBIOS */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="md:w-1/2 w-full flex flex-col justify-center items-center text-white p-12"
        >
          <img
            src="/logo.png"
            alt="Logo Gobernación de Boyacá"
            className="w-[28rem] h-auto mb-10 drop-shadow-2xl transition-transform duration-500 hover:scale-105"
          />
          <h1 className="text-5xl font-bold text-center leading-tight mb-3">
            Gobernación de Boyacá
            <br />
            <span className="text-3xl font-semibold text-green-100">
              Certificación
            </span>
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md leading-relaxed">
            “Transparencia, servicio y eficiencia al servicio de los municipios boyacenses.”
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
              Bienvenido
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = Object.fromEntries(new FormData(e.target));
                handleLogin(form);
              }}
              className="space-y-8"
            >
              {/* Campo usuario - SIN CAMBIOS */}
              <div>
                <label htmlFor="login" className="block text-gray-700 font-semibold mb-2">
                  Usuario
                </label>
                <div className="flex items-center bg-green-50 border border-green-300 rounded-xl px-5 py-3 focus-within:ring-2 focus-within:ring-green-600 transition-all">
                  <User className="text-green-700 mr-3" size={22} />
                  <input
                    type="text"
                    id="login"
                    name="login"
                    placeholder="Ingrese su usuario"
                    required
                    className="w-full bg-transparent focus:outline-none text-gray-800 placeholder-green-700/50 text-lg"
                  />
                </div>
              </div>

              {/* Campo contraseña - SIN CAMBIOS */}
              <div>
                <label htmlFor="contraseña" className="block text-gray-700 font-semibold mb-2">
                  Contraseña
                </label>
                <div className="flex items-center bg-green-50 border border-green-300 rounded-xl px-5 py-3 focus-within:ring-2 focus-within:ring-green-600 transition-all">
                  <Lock className="text-green-700 mr-3" size={22} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="contraseña"
                    name="contraseña"
                    placeholder="Ingrese su contraseña"
                    required
                    className="w-full bg-transparent focus:outline-none text-gray-800 placeholder-green-700/50 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2 text-green-700 hover:text-green-900 transition-all focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              {/* Enlace de Recuperación de Contraseña (NUEVO) */}
              <div className="text-right text-gray-700 -mt-6">
                <Link
                  to="/forgot-password"
                  className="text-green-600 hover:text-green-800 hover:underline transition-colors font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Captcha - SIN CAMBIOS */}
              <div className="flex justify-center">
                <ReCAPTCHA
                  sitekey="6LcceNwrAAAAAIjw8rb6K56RaqYj5onuHT-_XQRl"
                  onChange={(token) => setCaptchaToken(token)}
                />
              </div>

              {/* Botón - SIN CAMBIOS */}
              <div className="flex justify-center pt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full py-4 text-lg rounded-xl font-semibold bg-gradient-to-r from-green-700 to-emerald-500 text-white hover:from-green-800 hover:to-emerald-600 transition-all shadow-lg"
                >
                  Iniciar Sesión
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}