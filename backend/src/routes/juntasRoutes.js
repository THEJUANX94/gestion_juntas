import { Router } from "express";
import { 
  crearJunta, 
  obtenerJuntas, 
  obtenerJuntaPorId, 
  actualizarJunta, 
  eliminarJunta, 
  obtenerTodasLasJuntas, 
  exportarJuntasExcel, 
  cambiarPeriodoJunta, 
  reporteEdades,
  reporteComisiones,
  reporteJuntasActivas,
  reporteCargos,
  reporteGenero
} from "../controllers/juntasController.js";

import {
  exportarReporte,
  reporteMunicipios,
  reporteProvincias
} from "../controllers/juntasControllerReportes.js";

import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

const ROLES_INFORMES = [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.DESCARGA, ROLES.CONSULTA];

// ===================================
// RUTAS PARA REPORTES
// ===================================

// Reportes JSON (del controlador antiguo)
router.get("/reports/edades", verificarAuth, verificarRol(ROLES_INFORMES), reporteEdades);
router.get("/reports/comisiones", verificarAuth, verificarRol(ROLES_INFORMES), reporteComisiones);
router.get("/reports/activas", verificarAuth, verificarRol(ROLES_INFORMES), reporteJuntasActivas);
router.get("/reports/cargos", verificarAuth, verificarRol(ROLES_INFORMES), reporteCargos);
router.get("/reports/genero", verificarAuth, verificarRol(ROLES_INFORMES), reporteGenero);

// Reportes JSON (del controlador nuevo)
router.get("/reports/provincias", verificarAuth, verificarRol(ROLES_INFORMES), reporteProvincias);
router.get("/reports/municipios", verificarAuth, verificarRol(ROLES_INFORMES), reporteMunicipios);

// Exportación de reportes (Excel, Word, PDF)
router.get("/reports/:tipo/export", verificarAuth, verificarRol(ROLES_INFORMES), exportarReporte);

// ===================================
// CRUD JUNTAS
// ===================================

router.post("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearJunta);

router.get("/", obtenerJuntas);
router.get("/all", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.DESCARGA]), obtenerTodasLasJuntas);
router.get("/export/excel", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), exportarJuntasExcel);
router.post("/:id/cambiar-periodo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), cambiarPeriodoJunta);

router.get("/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerJuntaPorId); 
router.put("/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarJunta); 

router.delete("/:id", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarJunta);

export default router;