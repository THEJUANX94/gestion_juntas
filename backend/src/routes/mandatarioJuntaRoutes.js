import { Router } from "express";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente } from "../controllers/mandatarioJuntaController.js";

const router = Router();

router.post("/crear/:id", crearMandatario);
router.get("/:id/miembros", getMiembrosJunta);
router.get("/buscar", buscarMandatarios);
router.post ("/agregar-existente/:idJunta", agregarMandatarioExistente)


export default router;
