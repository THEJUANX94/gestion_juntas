import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { verificarSesion } from "../controllers/authController.js";

const router = Router();

const logTest = (req, res, next) => {
    next();
};

router.get('/check-session',logTest, verificarAuth, (req, res) => {
    res.status(200).json({ 
        isAuthenticated: true, 
        user: { 
            id: req.usuario.id, 
            rol: req.usuario.rol 
        } 
    });
});
router.post('/logout', (req, res) => {
    res.cookie('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Sesión cerrada exitosamente.' });
});

router.get("/verify", verificarSesion);

export default router;