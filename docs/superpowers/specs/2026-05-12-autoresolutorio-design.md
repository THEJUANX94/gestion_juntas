# Diseño: Actualización Sistema Auto Resolutorio

**Fecha:** 2026-05-12  
**Estado:** Aprobado

---

## Contexto

Sistema de gestión de juntas comunales (Gobernación de Boyacá). El flujo de "Auto Resolutorio" genera un PDF legal con dignatarios. Se requiere: nuevo rol de acceso, rastreo de autoría, clasificación correcta de comisiones y correcciones menores en el PDF y frontend.

---

## 1. Roles y Permisos

### Nuevo rol `GeneracionAuto`
- UUID DB: `1fc8d335-f51f-47f3-a7fc-535b0c66fad4`
- Ya existe en la tabla `roles` de la base de datos
- Heredar permisos de AUXILIAR: `PUEDE_CREAR`, `PUEDE_MODIFICAR`, `PUEDE_EDITAR`, `PUEDE_VER_INFORMES`, `PUEDE_CONSULTAR`

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `backend/src/config/roles.js` | Agregar `GENERACION_AUTO` con UUID; agregar a PERMISOS relevantes |
| `frontend/src/config/roles.js` | Igual + agregar a `NOMBRE_ROLES` como `"Generación Auto"` |
| `backend/src/routes/certificadosRoutes.js` | POST `/` cambia de `[ADMIN, AUXILIAR]` → `[ADMIN, GENERACION_AUTO]` |
| `frontend/src/App.jsx` | NIVEL 2 `RoleRoute`: agregar `ROLES.GENERACION_AUTO` |

### Restricción del botón en frontend
- `DetalleJunta.jsx`: filtrar array `acciones` — botón Autoresolutorio solo visible si `user.IDRol` es ADMIN o GENERACION_AUTO (UUID)
- AUXILIAR ya no ve ni puede ejecutar esta acción

---

## 2. Modelo de Datos

### `Junta` (tabla `juntas`)
Agregar campo:
```sql
ALTER TABLE juntas ADD COLUMN ultimo_editor TEXT;
```
- Tipo: TEXT, nullable
- Significado: nombre completo del último usuario que editó la junta o sus mandatarios

### `Certificados` (tabla `certificados`)
Agregar dos campos:
```sql
ALTER TABLE certificados ADD COLUMN elaborado_por TEXT;
ALTER TABLE certificados ADD COLUMN generado_por TEXT;
```
- `elaborado_por`: copia de `junta.ultimo_editor` al momento de generar
- `generado_por`: nombre del usuario autenticado que presionó el botón

### Controladores que actualizan `ultimo_editor` (Enfoque B)
Todos agregan `await junta.update({ ultimo_editor: req.usuario.nombre })` tras la operación principal:
1. Editar junta — controlador de edición existente
2. Crear mandatario
3. Editar mandatario
4. Eliminar mandatario

> El JWT actual solo contiene `{ id, IDRol }` — no incluye `nombre`. Para que `req.usuario.nombre` esté disponible en los controladores, se agrega `nombre` al payload del JWT en `CredencialesController.js` (sign call, línea ~106). Esto evita una query adicional por edición.

### `crearCertificado` actualizado
- Recibe `generadoPor` del body del request (enviado desde frontend)
- Lee `junta.ultimo_editor` como `elaboradoPor`
- Pasa ambos a `datosCertificado`
- Guarda ambos en `Certificados.create({ ..., elaborado_por: elaboradoPor, generado_por: generadoPor })`

---

## 3. Generación PDF (`autoresolutorio.js`)

### 3.1 Clasificación de comisiones
Reemplazar el `comisionesMap` actual (agrupa por nombre exacto de comisión) con 3 categorías fijas:

```js
const clasificarComision = (nombreComision) => {
  const n = nombreComision.toLowerCase();
  if (n.includes('convivencia') || n.includes('conciliaci')) return 'COMISIÓN DE CONVIVENCIA Y CONCILIACIÓN';
  if (n.includes('empresarial')) return 'COMISIÓN EMPRESARIAL';
  return 'COMISIONES DE TRABAJO';
};
```

Estructura resultante:
```js
const comisionesAgrupadas = {
  'COMISIÓN DE CONVIVENCIA Y CONCILIACIÓN': { rows: [] },
  'COMISIÓN EMPRESARIAL':                   { rows: [] },
  'COMISIONES DE TRABAJO':                  { rows: [] },
};
```
Solo se dibujan las categorías que tienen filas (no dibujar tablas vacías).

**Verificación:** "Comisión de Salud" → no contiene "convivencia", "conciliaci", ni "empresarial" → cae en "COMISIONES DE TRABAJO". ✓

### 3.2 Orden Presidente
Antes de dibujar la tabla DIRECTIVOS, ordenar:
```js
directivos.sort((a, b) => a[0] === 'Presidente' ? -1 : b[0] === 'Presidente' ? 1 : 0);
```
El Presidente queda en índice 0 siempre, sin importar el orden de inserción.

### 3.3 Footer — Elaboró y generó
Reemplazar líneas actuales (Proyectó / Revisó):
```js
doc.text('Proyectó:________________', margenIzq, yPos);
doc.text('Revisó_________________', margenIzq, yPos + 5);
```
Por:
```js
doc.setFont('helvetica', 'bold');
doc.text('Elaboró y generó:', margenIzq, yPos);
doc.setFont('helvetica', 'normal');
yPos += 5;
doc.text(`Elaboró: ${datosCertificado.elaboradoPor || '________________'}`, margenIzq, yPos);
yPos += 5;
doc.text(`Generó: ${datosCertificado.generadoPor || '________________'}`, margenIzq, yPos);
```

### 3.4 Firmante
Sin cambio requerido — línea 387 ya tiene fallback correcto:
```js
centerText(doc, resources.cargoFirmante || 'DIRECTORA DE PARTICIPACION Y ACCION COMUNAL', ...)
```

---

## 4. Frontend

### 4.1 `DetalleJunta.jsx`
```js
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';

const { user } = useAuth();

const accionesFiltradas = acciones.filter(a =>
  a.action !== 'autoresolutorio' ||
  [ROLES.ADMIN, ROLES.GENERACION_AUTO].includes(user?.IDRol)
);
```
En `generatePdfForJunta`, agregar al payload:
```js
const payload = { IDJunta, tipo, generadoPor: user?.nombre };
```
Usar `accionesFiltradas` en el render (en lugar de `acciones`).

### 4.2 `ValidacionQR.jsx`
Agregar al bloque "Certificado válido":
```jsx
<div>
  <span className="font-bold">Elaborado por:</span>{' '}
  {result.data.ElaboradoPor || 'No registrado'}
</div>
<div>
  <span className="font-bold">Generado por:</span>{' '}
  {result.data.GeneradoPor || 'No registrado'}
</div>
```

---

## 5. Fix: Auth mismatch (incluido en scope)

### Problema
- `authController.verificarSesion` retorna `{ usuario: data }` y `IDRol` = nombre del rol (string)
- `AuthContext` espera `{ valid: true, user: data }` y usa `user.IDRol` como UUID para comparar con `ROLES.*`

### Fix en `authController.js`
```js
return res.json({
  valid: true,
  user: {
    numeroIdentificacion: usuario.numeroIdentificacion,
    nombre: `${...}`.trim(),
    correo: usuario.Correo,
    IDRol: decoded.IDRol,       // UUID desde JWT (no el nombre)
    nombreRol: usuario.RolInfo?.NombreRol || 'Sin rol'  // para display
  }
});
```
Requiere que el JWT incluya `IDRol` como UUID — verificar en el controlador de login y ajustar si no lo incluye.

### Fix en `AuthContext.jsx`
```js
if (data.valid) {
  setIsAuthenticated(true);
  setUser(data.user);
}
```
(Ya está escrito así — solo necesita que el backend retorne `{ valid: true, user: ... }`.)

---

## Archivos modificados (resumen)

**Backend:**
- `src/config/roles.js`
- `src/routes/certificadosRoutes.js`
- `src/controllers/CredencialesController.js` (agregar `nombre` al JWT)
- `src/controllers/authController.js` (fix response structure + usar `decoded.IDRol`)
- `src/controllers/certificadosController.js`
- `src/controllers/juntasController.js` (`actualizarJunta`)
- `src/controllers/mandatarioJuntaController.js` (`crearMandatario`, `actualizarMandatario`, `eliminarMandatario`)
- `src/model/juntaModel.js`
- `src/model/CertificadoModel.js`
- `src/libs/pdfs/autoresolutorio.js`

**Frontend:**
- `src/config/roles.js`
- `src/App.jsx`
- `src/pages/DetalleJunta.jsx`
- `src/pages/ValidacionQR.jsx`

---

## Verificaciones

- [ ] "Comisión de Salud" → clasifica en "COMISIONES DE TRABAJO"
- [ ] Presidente aparece primero aunque fue el último agregado
- [ ] Auxiliar no ve botón Autoresolutorio
- [ ] GeneracionAuto sí ve y puede ejecutar
- [ ] PDF pie muestra "Elaboró y generó" con nombres reales
- [ ] QR page muestra elaborado_por y generado_por
- [ ] Login y sesión funcionan correctamente tras fix de auth
