import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { crearCargo, eliminarCargo, obtenerCargos, obtenerCargoPorId, actualizarCargo } from '../controllers/cargosController.js';
import { ROLES } from "../config/roles.js";


const router = Router();

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerCargos);
router.get("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerCargoPorId);
router.put("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarCargo);
router.delete("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarCargo);
router.post("/crearcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), crearCargo);
export default router;