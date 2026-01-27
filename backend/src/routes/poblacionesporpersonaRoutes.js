import { Router } from "express";
import {
    obtenerPoblacionesPorPersona,
    obtenerPoblacionesPorDocumento,
    crearPoblacionPorPersona,
    actualizarPoblacionPorPersona,
    eliminarPoblacionPorPersona,
    eliminarPoblacionesPorDocumento,
} from "../controllers/poblacionesporpersonaController.js";

const router = Router();

router.get("/", obtenerPoblacionesPorPersona);
router.get("/:documento", obtenerPoblacionesPorDocumento);
router.post("/", crearPoblacionPorPersona);
router.put("/:documento/:idgrupo", actualizarPoblacionPorPersona);
router.delete("/:documento/:idgrupo", eliminarPoblacionPorPersona);
router.delete("/documento/:documento", eliminarPoblacionesPorDocumento);

export default router;