import { Router } from "express";
import {getMiembrosJunta, crearMandatario } from "../controllers/mandatarioJuntaController.js";

const router = Router();

router.post("/crear/:id", crearMandatario);
router.get("/:id/miembros", getMiembrosJunta);

export default router;
