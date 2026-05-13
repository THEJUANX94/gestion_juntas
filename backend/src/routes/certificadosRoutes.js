import { Router } from "express";
import { crearCertificado, enviarAutoresolutorio, validarCertificado, previewCertificado } from "../controllers/certificadosController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.post('/', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.GENERACION_AUTO]), crearCertificado);
router.post('/preview', verificarAuth, previewCertificado);
router.post('/solicitar', enviarAutoresolutorio);
router.get('/validar/:IDCertificado', validarCertificado);

export default router;
