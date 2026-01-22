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
} from "../controllers/usuarioController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

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
router.get("/", verificarAuth, obtenerUsuarios);
router.get("/:NumeroIdentificacion", verificarAuth, obtenerUsuarioPorId);
router.get("/verificar/:NumeroIdentificacion", verificarIdentificacion);
router.get("/verificar-correo/:correo", verificarCorreo);
router.put("/:IDUsuario", verificarAuth, actualizarUsuario);
router.delete("/:IDUsuario", verificarAuth, eliminarUsuario);


export default router;
