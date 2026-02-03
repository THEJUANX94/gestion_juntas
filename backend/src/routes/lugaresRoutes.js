import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import {
  obtenerLugares,
  obtenerLugarPorId,
  eliminarLugar,
  crearLugar,
  cambiarEstadoLugar,
  obtenerMunicipiosPorDepartamento,
} from "../controllers/lugaresController.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerLugares);
router.get("/municipios", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerMunicipiosPorDepartamento)
router.get("/:idlugar", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerLugarPorId);
router.delete("/:idlugar", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarLugar);
router.post("/crearlugar", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearLugar);
router.patch("/:idlugar/estado", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), cambiarEstadoLugar);

export default router;
