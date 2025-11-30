import { Router } from "express";
import { verificarAuth } from "../utils/authMiddleware.js";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente } from "../controllers/mandatarioJuntaController.js";

const router = Router();

router.post("/crear/:id", verificarAuth, crearMandatario);
router.get("/:id/miembros", verificarAuth, getMiembrosJunta);
router.get("/buscar", verificarAuth, buscarMandatarios);
router.post ("/agregar-existente/:idJunta", verificarAuth, agregarMandatarioExistente)


export default router;
