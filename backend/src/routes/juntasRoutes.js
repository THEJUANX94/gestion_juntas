import { Router } from "express";
import { crearJunta, obtenerJuntas, obtenerJuntaPorId, actualizarJunta, eliminarJunta} from "../controllers/juntasController.js";

const router = Router();


router.post("/", crearJunta);

router.get("/", obtenerJuntas);

router.get("/:id", obtenerJuntaPorId); 
router.put("/:id", actualizarJunta); 

router.delete("/:id", eliminarJunta);

export default router;
