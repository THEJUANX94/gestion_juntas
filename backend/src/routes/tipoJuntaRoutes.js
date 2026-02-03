import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerTiposJunta,
  obtenerTipoJuntaPorId,
  eliminarTipoJunta,
  crearTipoJunta
} from "../controllers/tipoJuntaController.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerTiposJunta);
router.get("/:idtipojunta",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerTipoJuntaPorId);
router.delete("/:idtipojunta", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarTipoJunta);
router.post("/creartipojunta", verificarAuth, verificarRol([ROLES.ADMIN]), crearTipoJunta);

export default router;
