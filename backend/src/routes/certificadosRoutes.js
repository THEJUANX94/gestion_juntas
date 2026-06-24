import { Router } from "express";
import { crearCertificado, enviarAutoresolutorio, validarCertificado, previewCertificado, reporteAutoresolutorios, listarCertificados, exportarCertificadosExcel, descargarCertificado } from "../controllers/certificadosController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get('/reports/autoresolutorios', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.DESCARGA, ROLES.GENERACION_AUTO]), reporteAutoresolutorios);
router.get('/listar', verificarAuth, verificarRol([ROLES.ADMIN]), listarCertificados);
router.get('/export/excel', verificarAuth, verificarRol([ROLES.ADMIN]), exportarCertificadosExcel);
router.get('/descargar/:IDCertificado', verificarAuth, verificarRol([ROLES.ADMIN]), descargarCertificado);
router.post('/', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.GENERACION_AUTO]), crearCertificado);
router.post('/preview', verificarAuth, previewCertificado);
router.post('/solicitar', enviarAutoresolutorio);
router.get('/validar/:IDCertificado', validarCertificado);

export default router;
