import { Router } from "express";
import { crearJunta, obtenerJuntas, eliminarJunta} from "../controllers/juntasController.js";

const router = Router();


router.post("/", crearJunta);

router.get("/", obtenerJuntas);

router.delete("/:id", eliminarJunta);

export default router;
