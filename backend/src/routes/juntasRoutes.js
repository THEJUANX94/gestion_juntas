import { Router } from "express";
import { crearJunta, obtenerJuntas, obtenerJuntaPorId, actualizarJunta, eliminarJunta} from "../controllers/juntasController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();


router.post("/", verificarAuth, crearJunta);

router.get("/", verificarAuth, obtenerJuntas);

router.get("/:id", obtenerJuntaPorId); 
router.put("/:id", actualizarJunta); 

router.delete("/:id", eliminarJunta);

export default router;
