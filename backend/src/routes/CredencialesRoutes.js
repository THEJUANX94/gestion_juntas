import { Router } from "express";
import { loginUsuario, forgotPassword, resetPassword, ChangePassword } from "../controllers/CredencialesController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();

router.post("/", loginUsuario);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', verificarAuth, ChangePassword);

export default router;
