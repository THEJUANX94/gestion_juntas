# Autoresolutorio System Update — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GeneracionAuto` role with autoresolutorio access, track document authorship (`ultimo_editor`), fix commission classification in the PDF, and surface author info in QR validation.

**Architecture:** Changes span backend (roles, routes, controllers, models, PDF generator) and frontend (role-based UI, QR display). DB schema changes are applied via raw SQL before Sequelize model updates. Auth bug (mismatched `/auth/verify` response + IDRol as name instead of UUID) is fixed as part of this work.

**Tech Stack:** Node.js + Express + Sequelize (PostgreSQL), React + Vite, jsPDF, JWT (jsonwebtoken), Tailwind CSS.

---

## File Map

| File | Change |
|---|---|
| `backend/src/config/roles.js` | Add `GENERACION_AUTO` constant + PERMISOS entries |
| `frontend/src/config/roles.js` | Same + NOMBRE_ROLES display name |
| `backend/src/routes/certificadosRoutes.js` | Remove AUXILIAR, add GENERACION_AUTO from POST `/` |
| `backend/src/routes/juntasRoutes.js` | Add GENERACION_AUTO to all AUXILIAR routes |
| `backend/src/routes/mandatarioJuntaRoutes.js` | Add GENERACION_AUTO to all AUXILIAR routes |
| `backend/src/controllers/CredencialesController.js` | Add `nombre` to JWT payload |
| `backend/src/controllers/authController.js` | Return `{ valid: true, user: { IDRol: UUID, ... } }` |
| `backend/src/model/juntaModel.js` | Add `UltimoEditor` field |
| `backend/src/model/CertificadoModel.js` | Add `ElaboradoPor` + `GeneradoPor` fields |
| `backend/src/controllers/juntasController.js` | Set `UltimoEditor` in `actualizarJunta` |
| `backend/src/controllers/mandatarioJuntaController.js` | Set `UltimoEditor` in crear/actualizar/eliminar |
| `backend/src/controllers/certificadosController.js` | Read `UltimoEditor` + `req.usuario.nombre`, save to Certificado |
| `backend/src/libs/pdfs/autoresolutorio.js` | Commission classification, Presidente sort, footer update |
| `frontend/src/App.jsx` | Add `GENERACION_AUTO` to NIVEL 2 RoleRoute |
| `frontend/src/pages/DetalleJunta.jsx` | Filter Autoresolutorio button by role |
| `frontend/src/pages/ValidacionQR.jsx` | Show `ElaboradoPor` / `GeneradoPor` |

---

## Task 1: Add GeneracionAuto Role to Configs and Routes

**Files:**
- Modify: `backend/src/config/roles.js`
- Modify: `frontend/src/config/roles.js`
- Modify: `backend/src/routes/certificadosRoutes.js`
- Modify: `backend/src/routes/juntasRoutes.js`
- Modify: `backend/src/routes/mandatarioJuntaRoutes.js`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Update backend roles.js**

Replace the content of `backend/src/config/roles.js`:

```js
export const ROLES = {
  ADMIN: "23b19304-f12f-4329-bc61-e297f80db8e2",
  AUXILIAR: "d9226d47-4e7b-465e-9bb9-9a24342a26ba",
  CONSULTA: "8d0784a1-7fc6-406a-903f-3b9bfd43ce16",
  DESCARGA: "820e649b-fcd8-435d-ae98-80e9be8afc27",
  GENERACION_AUTO: "1fc8d335-f51f-47f3-a7fc-535b0c66fad4"
};

export const PERMISOS = {
  ACCESO_TOTAL: [ROLES.SUPERADMIN],
  PUEDE_CREAR: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO],
  PUEDE_MODIFICAR: [ROLES.SUPERADMIN, ROLES.ADMIN],
  PUEDE_ELIMINAR: [ROLES.SUPERADMIN, ROLES.ADMIN],
  PUEDE_CONSULTAR: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO],
  PANEL_DESCARGA: [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.DESCARGA],
};
```

- [ ] **Step 2: Update frontend roles.js**

Replace the content of `frontend/src/config/roles.js`:

```js
export const ROLES = {
  ADMIN: "23b19304-f12f-4329-bc61-e297f80db8e2",
  AUXILIAR: "d9226d47-4e7b-465e-9bb9-9a24342a26ba",
  CONSULTA: "8d0784a1-7fc6-406a-903f-3b9bfd43ce16",
  DESCARGA: "820e649b-fcd8-435d-ae98-80e9be8afc27",
  GENERACION_AUTO: "1fc8d335-f51f-47f3-a7fc-535b0c66fad4"
};

export const NOMBRE_ROLES = {
  "23b19304-f12f-4329-bc61-e297f80db8e2": "Administrador",
  "d9226d47-4e7b-465e-9bb9-9a24342a26ba": "Auxiliar",
  "8d0784a1-7fc6-406a-903f-3b9bfd43ce16": "Consulta",
  "820e649b-fcd8-435d-ae98-80e9be8afc27": "Descarga",
  "1fc8d335-f51f-47f3-a7fc-535b0c66fad4": "Generación Auto"
};

export const PERMISOS = {
  ACCESO_TOTAL: [ROLES.ADMIN],
  PUEDE_CREAR: [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO],
  PUEDE_MODIFICAR: [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO],
  PUEDE_ELIMINAR: [ROLES.ADMIN],
  PUEDE_CONSULTAR: [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO],
  PANEL_DESCARGA: [ROLES.ADMIN, ROLES.DESCARGA],
  SOLO_ADMIN: [ROLES.ADMIN],
  PUEDE_EDITAR: [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO],
  PUEDE_VER_INFORMES: [ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO],
};
```

- [ ] **Step 3: Update certificadosRoutes.js**

In `backend/src/routes/certificadosRoutes.js`, change POST `/` to remove AUXILIAR and add GENERACION_AUTO:

```js
import { Router } from "express";
import { crearCertificado, enviarAutoresolutorio, validarCertificado } from "../controllers/certificadosController.js";
import { verificarAuth, verificarRol } from "../utils/authMiddleware.js";
import { ROLES } from "../config/roles.js";

const router = Router();

router.post('/', verificarAuth, verificarRol([ROLES.ADMIN, ROLES.GENERACION_AUTO]), crearCertificado);
router.post('/solicitar', enviarAutoresolutorio);
router.get('/validar/:IDCertificado', validarCertificado);

export default router;
```

- [ ] **Step 4: Update juntasRoutes.js — add GENERACION_AUTO wherever AUXILIAR appears**

In `backend/src/routes/juntasRoutes.js`, add `ROLES.GENERACION_AUTO` to every `verificarRol` array that currently contains `ROLES.AUXILIAR`. The affected lines are:
- `router.post("/", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]`
- `router.get("/export/excel", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]`
- `router.post("/:id/cambiar-periodo", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]`
- `router.get("/:id", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]`
- `router.put("/:id", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]`
- `router.get("/all", ...)` → `[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.DESCARGA, ROLES.GENERACION_AUTO]`

- [ ] **Step 5: Update mandatarioJuntaRoutes.js — add GENERACION_AUTO wherever AUXILIAR appears**

In `backend/src/routes/mandatarioJuntaRoutes.js`, add `ROLES.GENERACION_AUTO` to every array containing `ROLES.AUXILIAR`:

```js
router.post("/crear/:id", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), crearMandatario);
router.put("/editar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarMandatario);
router.get("/:id/miembros", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), getMiembrosJunta);
router.get("/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), obtenerMandatario);
router.put("/actualizar/:idJunta/:documento", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), actualizarMandatario);
router.get("/buscar", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), buscarMandatarios);
router.post("/agregar-existente/:idJunta", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]), agregarMandatarioExistente);
router.get("/validar/:idJunta/:idUsuario", verificarAuth, verificarRol([ROLES.ADMIN, ROLES.AUXILIAR, ROLES.CONSULTA, ROLES.GENERACION_AUTO]), validarMandatarioEnJunta);
router.delete("/:documento", verificarAuth, verificarRol([ROLES.ADMIN]), eliminarMandatario);
```

- [ ] **Step 6: Update App.jsx NIVEL 2 RoleRoute**

In `frontend/src/App.jsx`, add `ROLES.GENERACION_AUTO` to the NIVEL 2 `RoleRoute`:

```jsx
<Route element={<RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.AUXILIAR, ROLES.GENERACION_AUTO]} />}>
```

- [ ] **Step 7: Verify manually**
  - Start backend: `cd backend && npm run dev`
  - Log in as AUXILIAR user → try to access POST /certificados → expect 403
  - Log in as GENERACION_AUTO user → try to access POST /certificados → expect 200
  - All other AUXILIAR-accessible routes should work for GENERACION_AUTO

- [ ] **Step 8: Commit**

```bash
git add backend/src/config/roles.js frontend/src/config/roles.js backend/src/routes/certificadosRoutes.js backend/src/routes/juntasRoutes.js backend/src/routes/mandatarioJuntaRoutes.js frontend/src/App.jsx
git commit -m "feat: add GeneracionAuto role and update route permissions"
```

---

## Task 2: Fix Auth — JWT Includes nombre + authController Response

**Files:**
- Modify: `backend/src/controllers/CredencialesController.js`
- Modify: `backend/src/controllers/authController.js`

**Why:** JWT only has `{ id, IDRol }`. Controllers need `req.usuario.nombre` to store `ultimo_editor`. Also, `authController.verificarSesion` returns `{ usuario: data }` but `AuthContext` expects `{ valid: true, user: data }`. And `IDRol` was being returned as the role name string instead of UUID, breaking all frontend role comparisons.

- [ ] **Step 1: Add `nombre` to JWT in CredencialesController.js**

Find the `jwt.sign` call (around line 106) and add `nombre`:

```js
const token = jwt.sign(
    {
        id: user.numeroIdentificacion,
        IDRol: user.IDRol,
        nombre: `${user.PrimerNombre || ''} ${user.SegundoNombre || ''} ${user.PrimerApellido || ''} ${user.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim(),
    },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }
);
```

- [ ] **Step 2: Fix authController.verificarSesion**

Replace the entire function body of `verificarSesion` in `backend/src/controllers/authController.js`:

```js
export const verificarSesion = async (req, res) => {
  try {
    const token = req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ valid: false, error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ valid: false, error: "Token inválido" });
    }

    const usuario = await Usuario.findByPk(decoded.id, {
      include: [{ model: Rol, as: "RolInfo", attributes: ["NombreRol"] }],
      attributes: [
        "NumeroIdentificacion",
        "PrimerNombre",
        "SegundoNombre",
        "PrimerApellido",
        "SegundoApellido",
        "Correo",
      ],
    });

    if (!usuario) {
      return res.status(404).json({ valid: false, error: "Usuario no encontrado" });
    }

    return res.json({
      valid: true,
      user: {
        numeroIdentificacion: usuario.NumeroIdentificacion,
        nombre: `${usuario.PrimerNombre || ''} ${usuario.SegundoNombre || ''} ${usuario.PrimerApellido || ''} ${usuario.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim(),
        correo: usuario.Correo,
        IDRol: decoded.IDRol,
        nombreRol: usuario.RolInfo?.NombreRol || 'Sin rol'
      }
    });
  } catch (error) {
    console.error("Error verificando sesión:", error);
    return res.status(401).json({ valid: false, error: "Sesión no válida" });
  }
};
```

> Note: uses `decoded.id` (from JWT) instead of `decoded.numeroIdentificacion`. `IDRol` comes from the JWT (UUID), not from DB join (which returned the name).

- [ ] **Step 3: Verify manually**
  - Log in → open browser devtools → network tab → check `/auth/verify` response
  - Should return `{ valid: true, user: { IDRol: "23b19304-...", nombreRol: "Administrador", nombre: "Juan Pérez", ... } }`
  - Refresh page → user should remain logged in → role-based UI should render correctly

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/CredencialesController.js backend/src/controllers/authController.js
git commit -m "fix: include nombre in JWT and return valid/user from auth verify endpoint"
```

---

## Task 3: Database Schema + Sequelize Models

**Files:**
- Modify: `backend/src/model/juntaModel.js`
- Modify: `backend/src/model/CertificadoModel.js`

- [ ] **Step 1: Run SQL migrations**

Connect to the PostgreSQL database and run:

```sql
ALTER TABLE juntas ADD COLUMN IF NOT EXISTS ultimo_editor TEXT;
ALTER TABLE certificados ADD COLUMN IF NOT EXISTS elaborado_por TEXT;
ALTER TABLE certificados ADD COLUMN IF NOT EXISTS generado_por TEXT;
```

Verify:
```sql
SELECT column_name FROM information_schema.columns WHERE table_name = 'juntas' AND column_name = 'ultimo_editor';
SELECT column_name FROM information_schema.columns WHERE table_name = 'certificados' AND column_name IN ('elaborado_por', 'generado_por');
```
Expected: 1 row for `ultimo_editor`, 2 rows for `certificados`.

- [ ] **Step 2: Add UltimoEditor to juntaModel.js**

In `backend/src/model/juntaModel.js`, add the field before the closing `}` of the model definition (before `Activo`):

```js
  UltimoEditor: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "ultimo_editor"
  },
```

- [ ] **Step 3: Add ElaboradoPor + GeneradoPor to CertificadoModel.js**

In `backend/src/model/CertificadoModel.js`, add two fields after `TipoCertificado`:

```js
  ElaboradoPor: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "elaborado_por"
  },
  GeneradoPor: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "generado_por"
  }
```

- [ ] **Step 4: Verify Sequelize picks up the fields**

Restart the backend (`Ctrl+C` then `npm run dev`). If Sequelize is in `sync: false` mode (no auto-migration), no error on startup = fields registered correctly.

- [ ] **Step 5: Commit**

```bash
git add backend/src/model/juntaModel.js backend/src/model/CertificadoModel.js
git commit -m "feat: add ultimo_editor to juntas and elaborado/generado_por to certificados"
```

---

## Task 4: Track ultimo_editor on Junta Mutations

**Files:**
- Modify: `backend/src/controllers/juntasController.js`
- Modify: `backend/src/controllers/mandatarioJuntaController.js`

**Pattern:** After each successful mutation, set `junta.UltimoEditor = req.usuario.nombre`. `req.usuario` is available because all these routes run `verificarAuth` first. `req.usuario.nombre` exists after Task 2 (JWT now includes `nombre`).

- [ ] **Step 1: Update actualizarJunta in juntasController.js**

Find the `junta.update({ ... })` call (around line 610). Add `UltimoEditor` to the update object:

```js
await junta.update({
  RazonSocial: razonSocial,
  Direccion: direccion,
  NumPersoneriaJuridica: numPersoneriaJuridica,
  FechaCreacion: fechaCreacion,
  FechaInicioPeriodo: fechaInicioPeriodo,
  FechaFinPeriodo: fechaFinPeriodo,
  FechaAsamblea: fechaAsamblea,
  Zona: zona,
  TipoJunta: tipoJunta,
  IDMunicipio: idMunicipio,
  IDInstitucion: idInstitucion,
  Correo: correo,
  UltimoEditor: req.usuario.nombre
});
```

- [ ] **Step 2: Update crearMandatario in mandatarioJuntaController.js**

Find the section just before `await t.commit()` (around line 170). Insert the `UltimoEditor` update inside the transaction:

```js
await junta.update({ UltimoEditor: req.usuario.nombre }, { transaction: t });

await t.commit();
```

- [ ] **Step 3: Update actualizarMandatario in mandatarioJuntaController.js**

`actualizarMandatario` starts at line 591 and uses params `{ idJunta, documento }`. The `junta` variable is not in scope. Add a lookup + update before the success response (around line 706):

```js
// After all mandatario update logic, before the return res.json success:
const juntaToUpdate = await Junta.findByPk(idJunta);
if (juntaToUpdate) await juntaToUpdate.update({ UltimoEditor: req.usuario.nombre });

return res.json({ message: "Mandatario actualizado correctamente" });
```

- [ ] **Step 4: Update eliminarMandatario in mandatarioJuntaController.js**

`eliminarMandatario` (line 723) gets `idJunta` at line 738 from `mandatario.IDJunta`. Add the `UltimoEditor` update before the success response (around line 764):

```js
// After MandatarioJunta.destroy, before return res.json:
const juntaToUpdate = await Junta.findByPk(idJunta);
if (juntaToUpdate) await juntaToUpdate.update({ UltimoEditor: req.usuario.nombre });

return res.json({ message: "Mandatario eliminado correctamente de la junta" });
```

- [ ] **Step 5: Verify manually**
  - Log in as ADMIN or AUXILIAR
  - Edit a junta → check DB: `SELECT ultimo_editor FROM juntas WHERE idjunta = '<id>';`
  - Expected: full name of the logged-in user
  - Add/edit/delete a mandatario → check DB again → same field should update

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/juntasController.js backend/src/controllers/mandatarioJuntaController.js
git commit -m "feat: track ultimo_editor on junta and mandatario mutations"
```

---

## Task 5: Capture Authorship in certificadosController

**Files:**
- Modify: `backend/src/controllers/certificadosController.js`

**Logic:** `crearCertificado` is called when the internal Autoresolutorio button is pressed. `req.usuario.nombre` = who is generating (from JWT). `junta.UltimoEditor` = who last edited. Both are saved to the `Certificados` record and passed to the PDF generator.

- [ ] **Step 1: Update crearCertificado**

In `certificadosController.js`, find the `junta` lookup (line 26). After obtaining the junta, extract `elaboradoPor`:

```js
const junta = await Junta.findByPk(IDJunta);
if (!junta) { ... }

const elaboradoPor = junta.UltimoEditor || null;
const generadoPor = req.usuario?.nombre || null;
```

Find the `Certificados.create(...)` call (around line 104) and add the new fields:

```js
const nuevoCertificado = await Certificados.create({
  FechaCreacion: ahora,
  IDJunta: junta.IDJunta,
  NombreCertificado: junta.RazonSocial || `Certificado_${ahora.toISOString()}`,
  TipoCertificado: tipoCertificadoValue,
  ElaboradoPor: elaboradoPor,
  GeneradoPor: generadoPor
});
```

Find the `datosCertificado` object (around line 112) and add the two new fields:

```js
const datosCertificado = {
  FechaCreacion: ahora,
  IDCertificado: nuevoCertificado.IDCertificado,
  NombreMunicipio: nombreMunicipio || null,
  nombreOrganizacion: junta.RazonSocial || null,
  personeriaNumero: junta.NumPersoneriaJuridica || null,
  personeriaFecha: junta.FechaAsamblea || null,
  periodoInicio: junta.FechaInicioPeriodo || null,
  periodoFin: junta.FechaFinPeriodo || null,
  dignatarios: dignatarios.length > 0 ? dignatarios : null,
  TipoCertificado: tipoNombre || null,
  fechaEleccion: junta.FechaAsamblea || null,
  elaboradoPor,
  generadoPor
};
```

- [ ] **Step 2: Verify manually**
  - Trigger Autoresolutorio from the UI (as ADMIN or GENERACION_AUTO)
  - Check DB: `SELECT elaborado_por, generado_por FROM certificados ORDER BY idcertificado DESC LIMIT 1;`
  - Expected: `generado_por` = name of logged-in user, `elaborado_por` = name of last junta editor (or NULL if never edited)

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/certificadosController.js
git commit -m "feat: save elaborado_por and generado_por on certificado creation"
```

---

## Task 6: PDF Generator — Commission Classification, Presidente Order, Footer

**Files:**
- Modify: `backend/src/libs/pdfs/autoresolutorio.js`

- [ ] **Step 1: Add `clasificarComision` at module level**

In `backend/src/libs/pdfs/autoresolutorio.js`, after the `MESES_ES` array (around line 12) and before `parseToBogota`, insert:

```js
const clasificarComision = (nombreComision) => {
  const n = (nombreComision || '').toLowerCase();
  if (n.includes('convivencia') || n.includes('conciliaci')) {
    return 'COMISION DE CONVIVENCIA Y CONCILIACION';
  }
  if (n.includes('empresarial')) return 'COMISION EMPRESARIAL';
  return 'COMISIONES DE TRABAJO';
};
```

- [ ] **Step 2: Replace the entire dignatarios classification block**

In `backend/src/libs/pdfs/autoresolutorio.js`, find the block from line 295 (`if (datosCertificado.dignatarios && ...`) through line 343 (closing `}`). Replace the entire block with:

```js
if (datosCertificado.dignatarios && datosCertificado.dignatarios.length > 0) {
  const directivos = [];
  const fiscales = [];
  const delegados = [];
  const comisionesAgrupadas = {
    'COMISION DE CONVIVENCIA Y CONCILIACION': [],
    'COMISION EMPRESARIAL': [],
    'COMISIONES DE TRABAJO': []
  };

  datosCertificado.dignatarios.forEach(d => {
    const cargo = (d.cargo || '').trim();
    const cargoLower = cargo.toLowerCase();
    const comision = (d.comision || '').trim();
    const expedido = (d.expedidoEn || municipio || '').toUpperCase();
    const nombre = (d.nombre || '').toUpperCase();
    const cedula = (d.cedula || '').toString();

    if (comision) {
      const categoria = clasificarComision(comision);
      comisionesAgrupadas[categoria].push([cargo || comision, nombre, cedula, expedido]);
    } else if (cargoLower.includes('fiscal')) {
      fiscales.push([cargo, nombre, cedula, expedido]);
    } else if (cargoLower.includes('delegado')) {
      delegados.push([cargo, nombre, cedula, expedido]);
    } else {
      directivos.push([cargo, nombre, cedula, expedido]);
    }
  });

  directivos.sort((a, b) => a[0] === 'Presidente' ? -1 : b[0] === 'Presidente' ? 1 : 0);

  if (directivos.length > 0) {
    yPos = drawTable('DIRECTIVOS', 'CARGO', directivos, yPos);
  }
  if (fiscales.length > 0) {
    yPos = drawTable('FISCAL', 'CARGO', fiscales, yPos);
  }
  Object.entries(comisionesAgrupadas).forEach(([titulo, rows]) => {
    if (rows.length > 0) {
      yPos = drawTable(titulo, 'CARGO', rows, yPos);
    }
  });
  if (delegados.length > 0) {
    yPos = drawTable('DELEGADOS ANTE LA ORGANIZACION DE GRADO SUPERIOR', 'CARGO', delegados, yPos);
  }
} else {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('[ESPACIO PARA LISTADO DE DIGNATARIOS]', margenIzq + 10, yPos);
  yPos += 10;
}
```

- [ ] **Step 4: Update footer — replace Proyectó/Revisó with Elaboró y generó**

Find the footer section (around lines 392–395):

```js
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text('Proyectó:________________', margenIzq, yPos);
yPos += 5;
doc.text('Revisó_________________', margenIzq, yPos);
yPos += 8;
```

Replace with:

```js
doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.text('Elaboró y generó:', margenIzq, yPos);
yPos += 5;
doc.setFont('helvetica', 'normal');
doc.text(`Elaboró: ${datosCertificado.elaboradoPor || '________________'}`, margenIzq, yPos);
yPos += 5;
doc.text(`Generó: ${datosCertificado.generadoPor || '________________'}`, margenIzq, yPos);
yPos += 8;
```

- [ ] **Step 5: Verify manually**
  - Trigger Autoresolutorio → open downloaded PDF
  - Check: comisión "Convivencia Ciudadana" → appears under "COMISIÓN DE CONVIVENCIA Y CONCILIACIÓN"
  - Check: comisión "Comisión de Salud" → appears under "COMISIONES DE TRABAJO"
  - Check: Presidente is first row in DIRECTIVOS table even if added last
  - Check: footer shows "Elaboró y generó:" with actual names (or underscores if null)

- [ ] **Step 6: Commit**

```bash
git add backend/src/libs/pdfs/autoresolutorio.js
git commit -m "feat: classify commissions by category, sort Presidente first, update footer"
```

---

## Task 7: Frontend — DetalleJunta Role-Based Button Filter

**Files:**
- Modify: `frontend/src/pages/DetalleJunta.jsx`

- [ ] **Step 1: Import useAuth and ROLES**

At the top of `frontend/src/pages/DetalleJunta.jsx`, add to the existing imports:

```js
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';
```

- [ ] **Step 2: Extract user from auth context**

Inside the `DetalleJunta` component, after the existing state declarations, add:

```js
const { user } = useAuth();
```

- [ ] **Step 3: Filter the acciones array**

After the `acciones` array definition (around line 120), add:

```js
const accionesFiltradas = acciones.filter(accion =>
  accion.action !== 'autoresolutorio' ||
  [ROLES.ADMIN, ROLES.GENERACION_AUTO].includes(user?.IDRol)
);
```

- [ ] **Step 4: Use accionesFiltradas in render**

In the JSX (around line 329), replace `acciones.map(...)` with `accionesFiltradas.map(...)`:

```jsx
{accionesFiltradas.map((accion, idx) => {
```

- [ ] **Step 5: Verify manually**
  - Log in as AUXILIAR → go to any junta detail page → Autoresolutorio button should NOT appear
  - Log in as GENERACION_AUTO → same page → Autoresolutorio button SHOULD appear
  - Log in as ADMIN → button SHOULD appear

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DetalleJunta.jsx
git commit -m "feat: hide Autoresolutorio button for Auxiliar role"
```

---

## Task 8: Frontend — ValidacionQR Display Authorship

**Files:**
- Modify: `frontend/src/pages/ValidacionQR.jsx`

- [ ] **Step 1: Add ElaboradoPor and GeneradoPor to valid certificate display**

In `frontend/src/pages/ValidacionQR.jsx`, find the valid certificate block (around line 39):

```jsx
<div><span className="font-bold">Fecha de Creación:</span> {new Date(result.data.FechaCreacion).toLocaleString()}</div>
<div><span className="font-bold">Tipo Junta:</span> {result.data.TipoCertificado}</div>
<div><span className="font-bold">Certificado:</span> {result.data.IDCertificado}</div>
```

Add two lines after `IDCertificado`:

```jsx
<div><span className="font-bold">Fecha de Creación:</span> {new Date(result.data.FechaCreacion).toLocaleString()}</div>
<div><span className="font-bold">Tipo Junta:</span> {result.data.TipoCertificado}</div>
<div><span className="font-bold">Certificado:</span> {result.data.IDCertificado}</div>
<div><span className="font-bold">Elaborado por:</span> {result.data.ElaboradoPor || 'No registrado'}</div>
<div><span className="font-bold">Generado por:</span> {result.data.GeneradoPor || 'No registrado'}</div>
```

- [ ] **Step 2: Verify manually**
  - Generate an Autoresolutorio as ADMIN (Task 5 must be done)
  - Note the `IDCertificado` from the downloaded PDF filename or DB
  - Navigate to `http://localhost:5173/validacionqr/<IDCertificado>`
  - Expected: green valid card shows "Elaborado por" and "Generado por" with actual names

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/ValidacionQR.jsx
git commit -m "feat: show elaborado_por and generado_por on QR validation page"
```

---

## Final Verification Checklist

Run through these scenarios end-to-end after all tasks complete:

- [ ] AUXILIAR logs in → DetalleJunta → Autoresolutorio button hidden
- [ ] GENERACION_AUTO logs in → DetalleJunta → Autoresolutorio button visible + works
- [ ] Editing a junta → DB `juntas.ultimo_editor` updates to logged-in user's name
- [ ] Adding a mandatario → DB `juntas.ultimo_editor` updates
- [ ] Editing a mandatario → DB `juntas.ultimo_editor` updates
- [ ] Deleting a mandatario → DB `juntas.ultimo_editor` updates
- [ ] Generating Autoresolutorio → PDF footer shows "Elaboró y generó" with correct names
- [ ] Junta with "Comisión de Convivencia Ciudadana" → PDF shows it under "COMISIÓN DE CONVIVENCIA Y CONCILIACIÓN"
- [ ] Junta with "Comisión de Salud" → PDF shows it under "COMISIONES DE TRABAJO"
- [ ] Junta with "Comisión Empresarial" → PDF shows it under "COMISIÓN EMPRESARIAL"
- [ ] Presidente appears first in DIRECTIVOS table regardless of insertion order
- [ ] `/validacionqr/<id>` shows "Elaborado por" and "Generado por"
- [ ] Page refresh after login keeps user authenticated (auth fix working)
- [ ] `user.IDRol` in frontend is the UUID (not the name string) — role-based UI renders correctly
