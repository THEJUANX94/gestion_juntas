import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerTiposJunta,
  obtenerTipoJuntaPorId,
  eliminarTipoJunta,
  crearTipoJunta
} from "../controllers/tipoJuntaController.js";

const router = Router();

router.get("/",  obtenerTiposJunta);
router.get("/:idtipojunta",  obtenerTipoJuntaPorId);
router.delete("/:idtipojunta", eliminarTipoJunta);
router.post("/creartipojunta", crearTipoJunta);

export default router;
