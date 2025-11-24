import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { crearInstitucion, eliminarInstitucion, obtenerInstituciones, obtenerInstitucionPorId } from '../controllers/institucionesController.js';

const router = Router();

router.get("/", obtenerInstituciones);
router.get("/:idinstitucion",  obtenerInstitucionPorId);
router.delete("/:idinstitucion",  eliminarInstitucion);
router.post("/crearinstitucion", crearInstitucion);

export default router;