import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { crearCargo, eliminarCargo, obtenerCargos, obtenerCargoPorId } from '../controllers/cargosController.js';

const router = Router();

router.get("/", verificarAuth, obtenerCargos);
router.get("/:idcargo", verificarAuth, obtenerCargoPorId);
router.delete("/idcargo", verificarAuth, eliminarCargo);
router.post("/crearcargo", verificarAuth, crearCargo);

export default router;