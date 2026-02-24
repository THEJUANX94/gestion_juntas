import jwt from 'jsonwebtoken';

export const verificarAuth = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. (Token no encontrado)' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;

    console.log(`Token verificado. Usuario ID: ${decoded.id}`);

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autenticado.' });
    }

    console.log("Roles permitidos:", rolesPermitidos);
    console.log("Rol del usuario haciendo la petición:", req.usuario.rol);
    console.log("Tipo de dato del rol:", typeof req.usuario.rol);
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }

    next();
  };
};