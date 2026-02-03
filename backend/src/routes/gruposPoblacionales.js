import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { obtenerGrupos } from "../controllers/gruposPoblacionales.js";
const router = Router();

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerGrupos);

export default router;
