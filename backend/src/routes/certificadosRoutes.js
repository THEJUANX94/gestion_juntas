import { Router } from "express";
import { crearCertificado, enviarAutoresolutorio, validarCertificado } from "../controllers/certificadosController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.post('/', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearCertificado);
router.post('/solicitar', enviarAutoresolutorio);
router.get('/validar/:IDCertificado', validarCertificado);

export default router;