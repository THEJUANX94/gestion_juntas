import { Router } from "express";
import { crearJunta, obtenerJuntas, getMiembrosJunta } from "../controllers/juntasController.js";

const router = Router();


router.post("/", crearJunta);

router.get("/", obtenerJuntas);


export default router;
