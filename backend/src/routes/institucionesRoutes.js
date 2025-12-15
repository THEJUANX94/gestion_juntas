import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { crearInstitucion, eliminarInstitucion, obtenerInstituciones, obtenerInstitucionPorId, actualizarInstitucion} from '../controllers/institucionesController.js';

const router = Router();

router.get("/", verificarAuth, obtenerInstituciones);
router.get("/:idinstitucion",  verificarAuth, obtenerInstitucionPorId);
router.put("/:idinstitucion",  verificarAuth, actualizarInstitucion);
router.delete("/:idinstitucion",  verificarAuth, eliminarInstitucion);
router.post("/crearinstitucion", verificarAuth, crearInstitucion);

export default router;