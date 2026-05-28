import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { crearInstitucion, eliminarInstitucion, obtenerInstituciones, obtenerInstitucionPorId, actualizarInstitucion} from '../controllers/institucionesController.js';
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/", obtenerInstituciones);
router.get("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerInstitucionPorId);
router.put("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarInstitucion);
router.delete("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN]), eliminarInstitucion);
router.post("/crearinstitucion", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), crearInstitucion);
export default router;