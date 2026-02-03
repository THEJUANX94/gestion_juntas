import { Router } from "express";
import { crearJunta, obtenerJuntas, obtenerJuntaPorId, actualizarJunta, eliminarJunta, obtenerTodasLasJuntas, exportarJuntasExcel, cambiarPeriodoJunta} from "../controllers/juntasController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();


router.post("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), crearJunta);

router.get("/", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerJuntas);
router.get("/all", verificarAuth, verificarRol([ROLES.ADMIN]), obtenerTodasLasJuntas);
router.get("/export/excel", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), exportarJuntasExcel);
router.post("/:id/cambiar-periodo", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), cambiarPeriodoJunta);

router.get("/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA]), obtenerJuntaPorId); 
router.put("/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR]), actualizarJunta); 

router.delete("/:id", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarJunta);

export default router;
