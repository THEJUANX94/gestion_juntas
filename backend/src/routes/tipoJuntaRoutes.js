import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import {
  obtenerTiposJunta,
  obtenerTipoJuntaPorId,
  eliminarTipoJunta,
  crearTipoJunta,
  actualizarTipoJunta
} from "../controllers/tipoJuntaController.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/",  verificarAuth, obtenerTiposJunta);
router.get("/:idtipojunta",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerTipoJuntaPorId);
router.delete("/:idtipojunta", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarTipoJunta);
router.post("/creartipojunta", verificarAuth, verificarRol([ROLES.ADMIN]), crearTipoJunta);
router.put("/:idtipojunta", verificarAuth, verificarRol([ROLES.ADMIN]), actualizarTipoJunta);

export default router;
