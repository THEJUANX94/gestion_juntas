import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { crearInstitucion, eliminarInstitucion, obtenerInstituciones, obtenerInstitucionPorId, actualizarInstitucion} from '../controllers/institucionesController.js';
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/", obtenerInstituciones);
router.get("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerInstitucionPorId);
router.put("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarInstitucion);
router.delete("/:idinstitucion",  verificarAuth, verificarRol([ROLES.ADMIN]), eliminarInstitucion);
router.post("/crearinstitucion", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearInstitucion);
export default router;