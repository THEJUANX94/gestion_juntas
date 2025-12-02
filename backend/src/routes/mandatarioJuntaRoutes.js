import { Router } from "express";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente, validarMandatarioEnJunta, eliminarMandatario } from "../controllers/mandatarioJuntaController.js";

const router = Router();

router.post("/crear/:id", crearMandatario);
router.get("/:id/miembros", getMiembrosJunta);
router.get("/buscar", buscarMandatarios);
router.post ("/agregar-existente/:idJunta", agregarMandatarioExistente)
router.get("/validar/:idJunta/:idUsuario", validarMandatarioEnJunta);
router.delete("/:documento", eliminarMandatario);



export default router;
