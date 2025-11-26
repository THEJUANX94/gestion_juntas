import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { obtenerComisiones, obtenerComisionPorId, crearComision, actualizarComision, eliminarComision } from "../controllers/comisionesController.js";
const router = Router();

router.get("/",  obtenerComisiones);
router.get("/:idcomision", obtenerComisionPorId);
router.post("/crearcomision", verificarAuth, crearComision);
router.put("/:idcomision", verificarAuth, actualizarComision);
router.delete("/:idcomision", verificarAuth, eliminarComision);


export default router;
