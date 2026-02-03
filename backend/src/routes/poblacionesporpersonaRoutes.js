import { Router } from "express";
import {
    obtenerPoblacionesPorPersona,
    obtenerPoblacionesPorDocumento,
    crearPoblacionPorPersona,
    actualizarPoblacionPorPersona,
    eliminarPoblacionPorPersona,
    eliminarPoblacionesPorDocumento,
} from "../controllers/poblacionesporpersonaController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/",verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerPoblacionesPorPersona);
router.get("/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerPoblacionesPorDocumento);
router.post("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearPoblacionPorPersona);
router.put("/:documento/:idgrupo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarPoblacionPorPersona);
router.delete("/:documento/:idgrupo", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarPoblacionPorPersona);
router.delete("/documento/:documento", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarPoblacionesPorDocumento);

export default router;