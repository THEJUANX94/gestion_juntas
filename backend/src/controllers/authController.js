import jwt from "jsonwebtoken";
import { Usuario } from "../model/usuarioModel.js";
import { Rol } from "../model/rolModel.js";

export const verificarSesion = async (req, res) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ valid: false, error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ valid: false, error: "Token inválido" });
    }

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: Rol, as: "RolInfo", attributes: ["NombreRol"] }],
      attributes: [
        "NumeroIdentificacion",
        "PrimerNombre",
        "SegundoNombre",
        "PrimerApellido",
        "SegundoApellido",
        "Correo",
      ],
    });

    if (!usuario) {
      return res.status(404).json({ valid: false, error: "Usuario no encontrado" });
    }

    return res.json({
      valid: true,
      user: {
        numeroIdentificacion: usuario.NumeroIdentificacion,
        nombre: `${usuario.PrimerNombre || ''} ${usuario.SegundoNombre || ''} ${usuario.PrimerApellido || ''} ${usuario.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim(),
        correo: usuario.Correo,
        IDRol: decoded.IDRol,
        nombreRol: usuario.RolInfo?.NombreRol || 'Sin rol'
      }
    });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return res.status(401).json({ valid: false, error: "Sesión no válida" });
  }
};
