import { Router } from "express";
import {
  obtenerLugares,
  obtenerLugarPorId,
  eliminarLugar,
  crearLugar,
  cambiarEstadoLugar,
} from "../controllers/lugaresController.js";

const router = Router();

router.get("/", obtenerLugares);
router.get("/:idlugar", obtenerLugarPorId);
router.delete("/:idlugar", eliminarLugar);
router.post("/crearlugar", crearLugar);
router.patch("/:idlugar/estado", cambiarEstadoLugar);

export default router;
