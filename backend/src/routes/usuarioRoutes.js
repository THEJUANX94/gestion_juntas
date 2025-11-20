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
  eliminarUsuario
} from "../controllers/usuariosController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();

// ========================
// Configuración de multer
// ========================

// Ruta absoluta a la carpeta "firmas" (una carpeta fuera del backend y frontend)
const firmasDir = path.resolve("../firmas");

// Configuración de almacenamiento físico en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, firmasDir); // guarda las firmas en /firmas
  },
  filename: (req, file, cb) => {
    // genera un nombre único
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

// ========================
// Rutas de usuarios
// ========================

router.post("/", verificarAuth, upload.single("Firma"), crearUsuario);
router.get("/", verificarAuth, obtenerUsuarios);
router.get("/:IDUsuario", verificarAuth, obtenerUsuarioPorId);
router.get("/verificar/:NumeroIdentificacion", verificarAuth, verificarIdentificacion);
router.get("/verificar-correo/:correo", verificarAuth, verificarCorreo);
router.put("/:IDUsuario", verificarAuth, actualizarUsuario);
router.delete("/:IDUsuario", verificarAuth, eliminarUsuario);

export default router;
