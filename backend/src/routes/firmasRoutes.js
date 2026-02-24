import { Router } from "express";
import {
  obtenerFirmas,
  obtenerFirmaPorId,
  eliminarFirma,
  actualizarEstadoFirma
} from "../controllers/firmasController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerFirmas);
router.get("/:IDFirma", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerFirmaPorId);
router.delete("/:IDFirma", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarFirma);
router.patch("/:identificacion/firma/estado", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarEstadoFirma);

export default router;
