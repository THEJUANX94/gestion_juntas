import { Router } from "express";
import { crearJunta, obtenerJuntas, getMiembrosJunta } from "../controllers/juntasController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();


router.post("/", verificarAuth, crearJunta);

router.get("/", verificarAuth, obtenerJuntas);


export default router;
