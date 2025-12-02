import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerTiposJunta,
  obtenerTipoJuntaPorId,
  eliminarTipoJunta,
  crearTipoJunta
} from "../controllers/tipoJuntaController.js";

const router = Router();

router.get("/",  verificarAuth, obtenerTiposJunta);
router.get("/:idtipojunta",  verificarAuth, obtenerTipoJuntaPorId);
router.delete("/:idtipojunta", verificarAuth, eliminarTipoJunta);
router.post("/creartipojunta", verificarAuth, crearTipoJunta);

export default router;
