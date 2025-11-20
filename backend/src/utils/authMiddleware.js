import jwt from 'jsonwebtoken';

export const verificarAuth = (req, res, next) => {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. (Token no encontrado)' }); 
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        req.usuario = decoded; 
        
        console.log(`✅ Token verificado. Usuario ID: ${decoded.id}`); 
        
        next(); 
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
    }
};

const ID_ROL_ADMINISTRADOR = "43eaceea-ec3a-487f-92f5-82b4c3ae7507";

export const verificarAdmin = (req, res, next) => {
    if (!req.usuario) {
        return res.status(401).json({ error: 'Debe estar autenticado para esta operación.' }); 
    }
    
    if (req.usuario.rol !== ID_ROL_ADMINISTRADOR) {
        return res.status(403).json({ error: 'Acceso prohibido. Se requiere rol de Administrador.' });
    }
    
    next();
};