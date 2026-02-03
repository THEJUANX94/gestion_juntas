import { Router } from "express";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import {
  obtenerTipoDocumento
} from "../controllers/tipoDocumentoController.js";

const router = Router();

router.get("/",  verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerTipoDocumento);


export default router;
