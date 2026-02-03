import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  verificarIdentificacion,
  verificarCorreo,
  actualizarUsuario,
  eliminarUsuario,
  obtenerMandatarios,
  actualizarEstadoFirma
} from "../controllers/usuarioController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

const firmasDir = path.resolve("firmas");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, firmasDir); 
  },
  filename: (req, file, cb) => {

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("Firma"), crearUsuario);
router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerUsuarios);
router.get("/mandatarios", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerMandatarios);
router.get("/verificar/:NumeroIdentificacion", verificarIdentificacion);
router.get("/verificar-correo/:correo", verificarCorreo);
router.get("/:NumeroIdentificacion", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerUsuarioPorId);
router.put("/:IDUsuario", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarUsuario);
router.delete("/:IDUsuario", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarUsuario);
router.patch("/:idUsuario/firma/estado", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarEstadoFirma);

export default router;
