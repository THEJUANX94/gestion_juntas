import { Router } from "express";
import { crearJunta, obtenerJuntas } from "../controllers/juntasController.js";

const router = Router();


router.post("/", crearJunta);

router.get("/", obtenerJuntas);

export default router;
