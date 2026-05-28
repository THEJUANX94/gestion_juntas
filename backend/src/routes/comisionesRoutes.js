import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { obtenerComisiones, obtenerComisionPorId, crearComision, actualizarComision, eliminarComision } from "../controllers/comisionesController.js";
import { ROLES } from "../config/roles.js";
const router = Router();

router.get("/",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerComisiones);
router.get("/:idcomision", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerComisionPorId);
router.post("/crearcomision", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), crearComision);
router.put("/:idcomision", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarComision);
router.delete("/:idcomision", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarComision);

export default router;
