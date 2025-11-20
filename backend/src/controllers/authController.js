import jwt from "jsonwebtoken";
import { Usuario } from "../model/usuarioModel.js";
import { Rol } from "../model/rolModel.js";

// ========================
// Verificar sesión activa
// ========================
export const verificarSesion = async (req, res) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // 🔑 Verificamos token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.numeroIdentificacion) {
      return res.status(401).json({ error: "Token inválido" });
    }

    // 🔍 Buscamos usuario en base de datos con su rol
    const usuario = await Usuario.findByPk(decoded.numeroIdentificacion, {
      include: [{ model: Rol, as: "RolInfo", attributes: ["NombreRol"] }],
      attributes: [
        "numeroIdentificacion",
        "PrimerNombre",
        "SegundoNombre",
        "PrimerApellido",
        "SegundoApellido",
        "Correo",
      ],
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarioData = {
      numeroIdentificacion: usuario.numeroIdentificacion,
      nombre: `${usuario.PrimerNombre} ${usuario.SegundoNombre || ""} ${usuario.PrimerApellido} ${usuario.SegundoApellido || ""}`.trim(),
      correo: usuario.Correo,
      rol: usuario.RolInfo?.NombreRol || "Sin rol",
    };

    return res.json({ usuario: usuarioData });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return res.status(401).json({ error: "Sesión no válida" });
  }
};
