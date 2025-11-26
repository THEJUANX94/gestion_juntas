import { Router } from "express";
import { crearCertificado, validarCertificado } from "../controllers/certificadosController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();

router.post('/', verificarAuth, crearCertificado);

router.get('/validar/:IDCertificado', validarCertificado);

export default router;