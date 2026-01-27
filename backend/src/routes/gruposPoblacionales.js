import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import { obtenerGrupos } from "../controllers/gruposPoblacionales.js";
const router = Router();

router.get("/",  verificarAuth, obtenerGrupos);

export default router;
