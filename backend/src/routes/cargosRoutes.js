import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { crearCargo, eliminarCargo, obtenerCargos, obtenerCargoPorId, actualizarCargo } from '../controllers/cargosController.js';
import { ROLES } from "../config/roles.js";


const router = Router();

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerCargos);
router.get("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]),obtenerCargoPorId);
router.put("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarCargo);
router.delete("/:idcargo", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarCargo);
router.post("/crearcargo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearCargo);
export default router;