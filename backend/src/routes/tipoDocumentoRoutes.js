import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerTipoDocumento
} from "../controllers/tipoDocumentoController.js";

const router = Router();

router.get("/",  verificarAuth, obtenerTipoDocumento);


export default router;
