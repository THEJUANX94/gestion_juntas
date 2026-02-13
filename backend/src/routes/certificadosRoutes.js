import { Router } from "express";
import { crearCertificado, validarCertificado } from "../controllers/certificadosController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.post('/', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearCertificado);
router.get('/solicitar/:IDJunta', crearCertificado);
router.get('/validar/:IDCertificado', validarCertificado);

export default router;