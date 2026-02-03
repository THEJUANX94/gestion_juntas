import { useState, useEffect, useRef } from "react"; // 👈 Importar 'useRef'
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const RECAPTCHA_SITE_KEY_V3 = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

export default function LoginUser() {
  const navigate = useNavigate();
  const { login: contextLogin, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // 1. Usar useRef para almacenar el objeto reCAPTCHA
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/juntas/crear", { replace: true });
    }

    // 2. Cargar el script de reCAPTCHA v3 al montar el componente
    // Google recomienda cargar el script con el parámetro render y la clave del sitio.
    const loadRecaptchaScript = () => {
      const scriptId = 're-captcha-script';
      if (document.getElementById(scriptId)) return;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY_V3}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);

      // Esperar a que el script cargue para asignarlo al ref
      script.onload = () => {
        if (window.grecaptcha && window.grecaptcha.ready) {
          window.grecaptcha.ready(() => {
            recaptchaRef.current = window.grecaptcha;
            console.log("reCAPTCHA v3 listo para ejecutar.");
          });
        }
      };
    };

    loadRecaptchaScript();

    // Limpieza si es necesario, aunque reCAPTCHA v3 es persistente
    // return () => { 
    //   const script = document.getElementById('re-captcha-script');
    //   if (script) document.body.removeChild(script);
    // };

  }, [isAuthenticated, navigate]);

  const handleLogin = async (form) => {
    const { login, contraseña } = form;

    let captchaToken = "";

    // 3. Ejecutar reCAPTCHA v3 para obtener el token
    if (recaptchaRef.current) {
      try {
        // La ejecución del token v3
        captchaToken = await recaptchaRef.current.execute(RECAPTCHA_SITE_KEY_V3, { action: 'login' });
      } catch (e) {
        console.error("Error al ejecutar reCAPTCHA v3:", e);
        AlertMessage.error("Error de verificación", "No se pudo obtener el token de reCAPTCHA.");
        return;
      }
    } else {
      // Este error no debería ocurrir si el script está cargado
      AlertMessage.info(
        "Verificación requerida",
        "El servicio reCAPTCHA aún no está cargado. Por favor, inténtalo de nuevo."
      );
      return;
    }

    // VERIFICAR AQUÍ: ¿captchaToken tiene un valor?
    if (!captchaToken || captchaToken.length < 10) {
      AlertMessage.error("Error de token", "El token de reCAPTCHA es inválido o vacío.");
      return;
    }
    try {
      // 4. Enviar el token v3 al backend para su verificación
      const response = await fetch(import.meta.env.VITE_PATH + "/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // Enviar el token obtenido por reCAPTCHA v3
        body: JSON.stringify({ login, contraseña, captcha: captchaToken }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || "Credenciales incorrectas o error en el servidor.");
      }

      const data = await response.json();
      console.log("Login exitoso:", data);

      contextLogin(data.user);

      AlertMessage.success("Inicio de sesión exitoso", "Bienvenido/a al sistema.");

    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      // El backend debe verificar el token y la PUNTUACIÓN. 
      // Si la puntuación es baja, debe rechazar el login.
      AlertMessage.error("Error de autenticación", "Usuario, contraseña o verificación incorrectos.");
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
              Gestión de Juntas
            </span>
          </h1>
          <p className="text-xl text-center opacity-90 max-w-md leading-relaxed">
            “Fortaleciendo la participación ciudadana desde el territorio.”
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