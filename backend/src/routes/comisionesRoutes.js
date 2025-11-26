import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { obtenerComisiones } from "../controllers/comisionesController.js";
const router = Router();

router.get("/",  obtenerComisiones);


export default router;
