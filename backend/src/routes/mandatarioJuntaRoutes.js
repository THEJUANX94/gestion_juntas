import { Router } from "express";
import {getMiembrosJunta, crearMandatario, buscarMandatarios, agregarMandatarioExistente, validarMandatarioEnJunta, eliminarMandatario, actualizarMandatario, obtenerMandatario } from "../controllers/mandatarioJuntaController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.post("/crear/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), crearMandatario);
router.put("/editar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarMandatario);
router.get("/:id/miembros", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), getMiembrosJunta);
router.get("/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerMandatario);
router.put("/actualizar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarMandatario);
router.get("/buscar", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), buscarMandatarios);
router.post("/agregar-existente/:idJunta", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), agregarMandatarioExistente);
router.get("/validar/:idJunta/:idUsuario", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), validarMandatarioEnJunta);
router.delete("/:documento", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarMandatario);

export default router;
