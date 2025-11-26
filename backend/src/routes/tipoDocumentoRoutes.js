import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {
  obtenerTipoDocumento
} from "../controllers/tipoDocumentoController.js";

const router = Router();

router.get("/",  obtenerTipoDocumento);


export default router;
