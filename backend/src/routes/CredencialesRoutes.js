import { Router } from "express";
import { loginUsuario, forgotPassword, resetPassword } from "../controllers/CredencialesController.js";

const router = Router();

router.post("/", loginUsuario);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
