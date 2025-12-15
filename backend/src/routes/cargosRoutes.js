import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { crearCargo, eliminarCargo, obtenerCargos, obtenerCargoPorId, actualizarCargo } from '../controllers/cargosController.js';

const router = Router();

router.get("/", obtenerCargos);
router.get("/:idcargo", obtenerCargoPorId);
router.put("/:idcargo", actualizarCargo);
router.delete("/:idcargo", eliminarCargo);
router.post("/crearcargo",  crearCargo);

export default router;