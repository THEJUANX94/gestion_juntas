import { Router } from "express";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente, validarMandatarioEnJunta, eliminarMandatario, actualizarMandatario, obtenerMandatario } from "../controllers/mandatarioJuntaController.js";
import { verificarAuth } from "../utils/authMiddleware.js";

const router = Router();

router.post("/crear/:id", verificarAuth, crearMandatario);
router.put("/editar/:idJunta/:documento", verificarAuth, crearMandatario);
router.get("/:id/miembros", verificarAuth, getMiembrosJunta);
router.get("/:idJunta/:documento", verificarAuth, obtenerMandatario);
router.put("/actualizar/:idJunta/:documento", verificarAuth, actualizarMandatario);
router.get("/buscar", verificarAuth, buscarMandatarios);
router.post ("/agregar-existente/:idJunta", verificarAuth, agregarMandatarioExistente)
router.get("/validar/:idJunta/:idUsuario", verificarAuth, validarMandatarioEnJunta);
router.delete("/:documento", verificarAuth, eliminarMandatario);



export default router;
