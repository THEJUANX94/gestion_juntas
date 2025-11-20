import { Router } from "express";
import {
  obtenerFirmas,
  obtenerFirmaPorId,
  eliminarFirma,
} from "../controllers/firmasController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();

router.get("/", verificarAuth, obtenerFirmas);
router.get("/:IDFirma", verificarAuth, obtenerFirmaPorId);
router.delete("/:IDFirma", verificarAuth, eliminarFirma);

export default router;
