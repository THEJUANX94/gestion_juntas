import { Router } from "express";
import { loginUsuario, forgotPassword, resetPassword, ChangePassword } from "../controllers/CredencialesController.js";

const router = Router();

router.post("/", loginUsuario);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', ChangePassword);

export default router;
