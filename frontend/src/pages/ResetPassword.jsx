import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function ResetPassword() {
    const { token } = useParams(); // 1. Obtiene el token de la URL
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false); // Para mostrar mensaje de éxito

    // Opcional: Validar que el token exista al cargar la página
    useEffect(() => {
        if (!token) {
            AlertMessage.error("Error", "Token de restablecimiento no encontrado.");
            navigate("/", { replace: true });
        }
    }, [token, navigate]);


    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            AlertMessage.info("Error de validación", "Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 8) {
             AlertMessage.info("Error de validación", "La contraseña debe tener al menos 8 caracteres.");
             return;
        }
        
        setLoading(true);

        try {
            // 2. Llamada al endpoint de Node.js con el token y la nueva contraseña
            const response = await fetch(import.meta.env.VITE_PATH + `/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword: password }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Si el token es inválido o expiró, el backend devuelve 400
                throw new Error(data.message || "Error al restablecer la contraseña.");
            }

            // Éxito
            setSuccess(true);
            AlertMessage.success("Éxito", data.message || "Tu contraseña ha sido restablecida.");

        } catch (err) {
            console.error("Error al restablecer la contraseña:", err);
            AlertMessage.error("Fallo", err.message || "El enlace puede haber expirado o es inválido.");
            // Si falla, redirigimos al olvido para que solicite uno nuevo
            setTimeout(() => {
                 navigate("/forgot-password");
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    // Si ya se restableció con éxito, mostramos un mensaje final
    if (success) {
        return (
             <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 text-white justify-center items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full max-w-md bg-white/95 backdrop-blur-lg shadow-2xl rounded-3xl p-12 text-center border border-green-200"
                >
                    <CheckCircle className="text-green-600 mx-auto mb-6" size={64} />
                    <h2 className="text-3xl font-bold text-green-800 mb-4">¡Contraseña Cambiada!</h2>
                    <p className="text-gray-700 mb-8">Tu contraseña ha sido actualizada con éxito. Ahora puedes ingresar al sistema con tus nuevas credenciales.</p>
                    <Link to="/" className="py-3 px-6 text-lg rounded-xl font-semibold bg-gradient-to-r from-green-700 to-emerald-500 text-white hover:from-green-800 hover:to-emerald-600 transition-all shadow-lg">
                        Ir a Iniciar Sesión
                    </Link>
                </motion.div>
             </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-800 via-green-600 to-emerald-400 text-white">
            {/* Contenedor principal */}
            <div className="flex flex-col md:flex-row flex-grow">
                {/* Lado izquierdo (estático) */}
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
                            Establecer Nueva Contraseña
                        </span>
                    </h1>
                    <p className="text-xl text-center opacity-90 max-w-md leading-relaxed">
                        Introduce y confirma tu nueva contraseña segura.
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
                            Nueva Contraseña
                        </h2>

                        <form onSubmit={handleResetPassword} className="space-y-8">
                            {/* Campo Nueva Contraseña */}
                            <div>
                                <label htmlFor="password" className="block text-gray-700 font-semibold mb-2">
                                    Nueva Contraseña
                                </label>
                                <div className="flex items-center bg-green-50 border border-green-300 rounded-xl px-5 py-3 focus-within:ring-2 focus-within:ring-green-600 transition-all">
                                    <Lock className="text-green-700 mr-3" size={22} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="Mínimo 8 caracteres"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            {/* Campo Confirmar Contraseña */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-gray-700 font-semibold mb-2">
                                    Confirmar Contraseña
                                </label>
                                <div className="flex items-center bg-green-50 border border-green-300 rounded-xl px-5 py-3 focus-within:ring-2 focus-within:ring-green-600 transition-all">
                                    <Lock className="text-green-700 mr-3" size={22} />
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        placeholder="Repita la nueva contraseña"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    {loading ? "Restableciendo..." : "Restablecer Contraseña"}
                                </motion.button>
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