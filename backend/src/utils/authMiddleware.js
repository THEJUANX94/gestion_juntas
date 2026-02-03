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
    if (!rolesPermitidos.includes(req.usuario.rol)) {
       return res.status(403).json({ error: 'No tienes permisos para realizar esta acción.' });
    }

    next();
  };
};