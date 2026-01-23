import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerLugares,
  obtenerLugarPorId,
  eliminarLugar,
  crearLugar,
  cambiarEstadoLugar,
  obtenerMunicipiosPorDepartamento,
} from "../controllers/lugaresController.js";

const router = Router();

router.get("/", verificarAuth, obtenerLugares);
router.get("/municipios", verificarAuth, obtenerMunicipiosPorDepartamento)
router.get("/:idlugar", verificarAuth, obtenerLugarPorId);
router.delete("/:idlugar", verificarAuth, eliminarLugar);
router.post("/crearlugar", verificarAuth, crearLugar);
router.patch("/:idlugar/estado", verificarAuth, cambiarEstadoLugar);

export default router;
