import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerLugares,
  obtenerLugarPorId,
  eliminarLugar,
  crearLugar
} from "../controllers/lugaresController.js";

const router = Router();

router.get("/",  obtenerLugares);
router.get("/:idlugar",  obtenerLugarPorId);
router.delete("/:idlugar",  eliminarLugar);
router.post("/crearlugar",  crearLugar);

export default router;
