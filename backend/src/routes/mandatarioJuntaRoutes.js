import { Router } from "express";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente, validarMandatarioEnJunta, eliminarMandatario, actualizarMandatario, obtenerMandatario } from "../controllers/mandatarioJuntaController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";

const router = Router();

router.post("/crear/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), crearMandatario);
router.put("/editar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarMandatario);
router.get("/:id/miembros", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), getMiembrosJunta);
router.get("/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerMandatario);
router.put("/actualizar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarMandatario);
router.get("/buscar", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), buscarMandatarios);
router.post ("/agregar-existente/:idJunta", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), agregarMandatarioExistente)
router.get("/validar/:idJunta/:idUsuario", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), validarMandatarioEnJunta);
router.delete("/:documento", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarMandatario);



export default router;
