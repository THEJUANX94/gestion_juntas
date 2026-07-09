# Migración a PgBouncer — servidor `bdqa`

Documento de referencia para los equipos de **desarrollo**, **servidores** y **redes**. Resume qué se tocó, qué se movió y dónde quedan los datos sensibles. Incluye además un tutorial general para migrar nuevas apps al mismo esquema.

## 1. Contexto / motivación

La app `gestion_juntas` presentó un incidente de producción (junio 2026): el pool de conexiones de PostgreSQL se agotaba (`SequelizeConnectionAcquireTimeoutError`), tumbando la disponibilidad de la app. Causa raíz: una fuga de transacciones en el backend (no se hacía `rollback` en ciertos `return` tempranos), que retenía conexiones indefinidamente.

Al investigar, se identificó un problema más amplio: el servidor de base de datos (`bdqa`) aloja **varias bases de datos de aplicaciones distintas en producción**, todas compartiendo el mismo límite global de PostgreSQL (`max_connections = 100`) y, hasta ahora, todas conectándose con el usuario **`postgres` (superusuario)**. Esto no escala y no aísla a las apps entre sí.

**Solución aplicada:** instalar PgBouncer (connection pooler) frente a PostgreSQL, y migrar cada app a un rol de base de datos dedicado.

## 2. Arquitectura

**Antes (todas las apps):**
```
app (servidor propio) ──── directo ────> PostgreSQL (bdqa, 172.20.1.30:5432)
                                           usuario: postgres (superusuario)
```

**Ahora (apps migradas):**
```
app (servidor propio) ──> PgBouncer (bdqa, 172.20.1.30:6432) ──> PostgreSQL (127.0.0.1:5432)
                            pool_mode = transaction                usuario: app_<nombre> dedicado
```

**Estado de migración:**

| App | Base de datos | Servidor de la app | Rol dedicado | Estado |
|---|---|---|---|---|
| gestion_juntas | `gestionjuntas` | `172.20.1.32` | `app_gestionjuntas` | ✅ Migrada |
| — | `GestionActivos` | `172.20.1.34` | `app_gestionactivos` | ✅ Migrada |
| — | `notificaciones` | `172.20.1.33` | `app_notificaciones` | ✅ Migrada |
| — | `sistema_alcaldias` | — | ya tiene rol propio (`postgrest_auth`) | ⏳ Pendiente de conectar a PgBouncer |

PgBouncer ya está instalado y listo para recibir bases adicionales — ver la sección 11 (tutorial) para el procedimiento general.

## 3. Servidor de base de datos (`bdqa`, 172.20.1.30)

- **SO:** AlmaLinux 10.1. **PostgreSQL:** 17 (paquete PGDG), puerto `5432`, datos en `/var/lib/pgsql/17/data`.
- **Paquete instalado:** `pgbouncer` 1.25.2 (repo `pgdg-common`) + dependencia `python3-psycopg2`.
- **Servicio:** `systemd` — `pgbouncer.service`, **habilitado** (arranca solo en boot), escuchando en todas las interfaces, puerto **6432**.
- **Usuario del sistema operativo:** `pgbouncer` (uid 1001) — cuenta ya provista por el equipo de servidores, es también el usuario bajo el que corre el servicio.
- **Archivos nuevos/tocados en el servidor:**
  | Archivo | Contenido | Permisos |
  |---|---|---|
  | `/etc/pgbouncer/pgbouncer.ini` | Configuración principal: bases registradas, modo de pool, **contraseñas reales de cada rol dedicado en texto plano** (necesarias para que PgBouncer abra conexiones al backend) | `600`, dueño `pgbouncer:pgbouncer` |
  | `/etc/pgbouncer/userlist.txt` | Verificadores SCRAM de los roles que pueden autenticarse contra PgBouncer | `600`, dueño `pgbouncer:pgbouncer` |
- **Firewall (`firewalld`, zona `public`):** se abrió el puerto **`6432/tcp`** (mismo alcance que ya tenía `5432/tcp`, sin restricción de origen adicional — no hace falta tocar el firewall de nuevo para futuras apps).
- **Red:** el servidor tiene la interfaz `ens3` en `172.20.1.30/20` (red interna donde están las apps) y `docker0` en `172.17.0.1/16` (usada por un contenedor local de **pgAdmin**, que corre en esta misma máquina — de ahí que aparezca en los logs con IP `172.17.0.2`).

## 4. Cambios en PostgreSQL

- **Roles dedicados creados:** `app_gestionjuntas`, `app_gestionactivos`, `app_notificaciones` — todos `LOGIN`, **no superusuario**, `CONNECTION LIMIT 15`, con permisos acotados únicamente a su propia base (`CONNECT`, `USAGE` en `public`, `SELECT/INSERT/UPDATE/DELETE` en tablas, `USAGE/SELECT` en secuencias, más privilegios por defecto para objetos futuros). Reemplazan el uso de `postgres` superusuario para cada app respectiva.
- **Rol auxiliar `pgbouncer_auth`:** se creó durante una prueba de arquitectura (enfoque `auth_query`, para evitar guardar contraseñas de apps). Se determinó que **no es viable** para el modo `transaction` de PgBouncer con SCRAM (PgBouncer necesita conocer la contraseña real del rol para abrir conexiones al backend, un verificador no alcanza). Se reutilizó como rol de **solo monitoreo** (agregado a `stats_users` en `pgbouncer.ini`, permite correr `SHOW CLIENTS`/`SHOW POOLS` sin usar la contraseña de `postgres`). Ver sección 9 (pendientes) para limpieza de lo que quedó sin usar del enfoque original.
- **Funciones `pgbouncer_user_lookup()`**, creadas en varias bases como parte del enfoque `auth_query` descartado. Sin uso actualmente, no hacen daño, pendientes de limpieza.

## 5. Cambios en el repositorio (`gestion_juntas`)

- **`backend/src/config/database.js`**: pool de Sequelize reducido de `max: 20, min: 2` a `max: 10, min: 1` — PgBouncer ya hace el pooling real hacia Postgres, el pool de la app solo controla conexiones (baratas) hacia PgBouncer.
- **`backend/src/controllers/mandatarioJuntaController.js`** y **`juntasController.js`**: refactor de transacciones manuales a transacciones gestionadas (`sequelize.transaction(async (t) => {...})`) en `crearMandatario`, `agregarMandatarioExistente`, `actualizarMandatario` y `cambiarPeriodoJunta`. Esto corrige la fuga de conexiones que causó el incidente original — ahora `commit`/`rollback` son automáticos y no se puede olvidar revertir en un `return` temprano.
- **`.env`** del servidor de la app (`172.20.1.32`, fuera del repositorio, no versionado): `DATABASE_URL` actualizado para apuntar a PgBouncer (`172.20.1.30:6432`) con el rol `app_gestionjuntas` en vez de `postgres` directo a `5432`.

Para las apps de `GestionActivos` y `notificaciones` (repositorios distintos, sin visibilidad de su código desde aquí) solo se actualizó su `DATABASE_URL` respectivo, siguiendo el mismo patrón.

## 6. Qué datos quedan almacenados y dónde

| Dato | Ubicación | Sensibilidad |
|---|---|---|
| Contraseñas reales de `app_gestionjuntas`, `app_gestionactivos`, `app_notificaciones` | `pgbouncer.ini` (servidor `bdqa`) y `.env` de cada app | Alta — acceso de escritura a su base respectiva |
| Verificadores SCRAM de los roles anteriores + `pgbouncer_auth` | `userlist.txt` (servidor `bdqa`) | Media — es un hash, no la contraseña en sí, pero sigue siendo sensible |
| `DATABASE_URL` completo (usuario + contraseña + host + puerto) | `.env` de cada app | Alta |
| `JWT_SECRET`, `EMAIL_PASS`, `RECAPTCHA_SECRET` (app gestion_juntas) | `.env` del servidor de la app | Alta — **quedaron expuestos accidentalmente en una conversación de chat durante este trabajo; ver pendientes** |

## 7. Sección de contraseñas / secretos

> ⚠️ **No completar esta tabla con valores reales si este archivo se va a subir a git o compartir por canales no seguros.** Usar un gestor de contraseñas (o el que ya use el equipo) y dejar aquí solo la referencia de dónde consultarlo.

| Secreto | Dónde vive | Valor / referencia |
|---|---|---|
| Rol `app_gestionjuntas` (Postgres) | `pgbouncer.ini`, `userlist.txt`, `.env` app | *(completar en gestor de contraseñas)* |
| Rol `app_gestionactivos` (Postgres) | `pgbouncer.ini`, `userlist.txt`, `.env` app | *(completar en gestor de contraseñas)* |
| Rol `app_notificaciones` (Postgres) | `pgbouncer.ini`, `userlist.txt`, `.env` app | *(completar en gestor de contraseñas)* |
| Rol `pgbouncer_auth` (Postgres) | `userlist.txt`, `stats_users` en `pgbouncer.ini` | *(en uso solo para monitoreo — ver sección 10)* |
| `JWT_SECRET` (app gestion_juntas) | `.env` app | *(pendiente de rotación — ver pendientes)* |
| `EMAIL_PASS` (app gestion_juntas) | `.env` app | *(pendiente de rotación — ver pendientes)* |
| `RECAPTCHA_SECRET` (app gestion_juntas) | `.env` app | *(completar en gestor de contraseñas)* |
| Usuario SO `pgbouncer` (servidor `bdqa`) | Acceso SSH | *(gestionado por equipo de servidores)* |

## 8. Pendientes / deuda técnica

- [ ] **Rotar `JWT_SECRET` y `EMAIL_PASS`** de `gestion_juntas` — quedaron expuestos accidentalmente en una conversación durante este trabajo. Rotar `JWT_SECRET` cierra la sesión de todos los usuarios activos (esperado, deben volver a iniciar sesión).
- [ ] Conectar `sistema_alcaldias` a PgBouncer (ya tiene rol propio `postgrest_auth`, solo falta la entrada en `pgbouncer.ini` con su contraseña real).
- [ ] Eliminar las funciones `pgbouncer_user_lookup()` en las bases donde se crearon (artefactos del enfoque `auth_query` descartado).
- [ ] Evaluar `ALTER DATABASE ... CONNECTION LIMIT` por base como capa adicional de gobernanza (hoy todas en `-1`, sin límite).
- [ ] Limpiar en `pg_hba.conf` la regla `md5` para `127.0.0.1/32` — queda inalcanzable detrás de la regla `scram-sha-256` para el mismo rango, es configuración muerta.
- [ ] A mediano plazo (si se agregan más de ~15-20 bases al servidor): revisar capacidad real de hardware de la VM (RAM es el recurso más ajustado hoy, 3.5 GB total).

## 9. Plan de reversa (por app)

Si PgBouncer o el rol dedicado presentan problemas con alguna app puntual:
1. En el `.env` del servidor de esa app, restaurar `DATABASE_URL` al valor anterior (directo a `172.20.1.30:5432`, usuario `postgres`).
2. Reiniciar el proceso de esa app.
3. El servicio de PgBouncer sigue corriendo sin afectar a las demás apps.

## 10. Comandos útiles para monitoreo/diagnóstico

```bash
# Estado del servicio
sudo systemctl status pgbouncer --no-pager

# Ver clientes conectados a PgBouncer (sí muestra la IP real de origen del cliente,
# a diferencia de pg_stat_activity en Postgres que solo vería 127.0.0.1)
psql "host=172.20.1.30 port=6432 dbname=pgbouncer user=pgbouncer_auth" -c "SHOW CLIENTS;"

# Ver pools activos y su uso
psql "host=172.20.1.30 port=6432 dbname=pgbouncer user=pgbouncer_auth" -c "SHOW POOLS;"

# Buscar conexiones de una app específica en el historial del log
# (más confiable que SHOW CLIENTS si la app usa conexiones muy cortas)
sudo grep "<nombre_base_o_ip_de_la_app>" /var/log/pgbouncer/pgbouncer.log | tail -n 40
```

```sql
-- Conexiones actuales a Postgres por base (ojo: si pasan por PgBouncer, client_addr
-- siempre se ve como 127.0.0.1, PgBouncer no preserva la IP original del cliente)
SELECT datname, usename, count(*) FROM pg_stat_activity GROUP BY datname, usename;
```

## 11. Tutorial — cómo migrar una nueva app/base de datos a PgBouncer

Procedimiento general para conectar una base de datos nueva (o existente) a este PgBouncer. Reemplaza `<app>` por un nombre corto (ej. `notificaciones`) y `<basededatos>` por el nombre real de la base.

### Paso 1 — Generar una contraseña fuerte

En el servidor `bdqa`, por SSH:
```bash
openssl rand -base64 24
```
Guárdala de inmediato en el gestor de contraseñas del equipo.

### Paso 2 — Crear el rol dedicado en Postgres

En pgAdmin (Query Tool, como superusuario, en cualquier base):
```sql
CREATE ROLE app_<app> WITH LOGIN PASSWORD 'LA_CONTRASEÑA_GENERADA' CONNECTION LIMIT 15;
```

### Paso 3 — Otorgar permisos, conectado específicamente a `<basededatos>`

```sql
GRANT CONNECT ON DATABASE <basededatos> TO app_<app>;
GRANT USAGE ON SCHEMA public TO app_<app>;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_<app>;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_<app>;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_<app>;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_<app>;
```
(Si el nombre de la base tiene mayúsculas, va entre comillas dobles: `"MiBase"`.)

### Paso 4 — Obtener el verificador SCRAM y agregarlo a `userlist.txt`

```sql
SELECT usename, passwd FROM pg_shadow WHERE usename = 'app_<app>';
```
No pegar el resultado en chats/tickets — copiarlo directo a la terminal del servidor.

```bash
sudo tee -a /etc/pgbouncer/userlist.txt > /dev/null << 'EOF'
"app_<app>" "SCRAM-SHA-256$...pegar-verificador-aqui..."
EOF
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
sudo chmod 600 /etc/pgbouncer/userlist.txt
```

### Paso 5 — Agregar la entrada en `pgbouncer.ini`

```bash
sudo nano /etc/pgbouncer/pgbouncer.ini
```
En la sección `[databases]`, agregar una línea (con la contraseña real, en texto plano, del Paso 1):
```
<basededatos> = host=127.0.0.1 port=5432 dbname=<basededatos> user=app_<app> password=LA_CONTRASEÑA_GENERADA
```

### Paso 6 — Verificar permisos y reiniciar PgBouncer

```bash
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini
sudo chmod 600 /etc/pgbouncer/pgbouncer.ini
sudo systemctl restart pgbouncer
sudo systemctl status pgbouncer --no-pager
```
Se usa `restart` y no `reload` — un `reload` no siempre re-mapea correctamente una base nueva o un `user=` forzado recién agregado.

### Paso 7 — Probar localmente desde el servidor `bdqa`

```bash
psql "host=127.0.0.1 port=6432 dbname=<basededatos> user=app_<app>" -c "SELECT current_database(), current_user;"
```

### Paso 8 — Actualizar el `.env` de la app real

Codificar la contraseña para la URL (los caracteres `+`, `/`, `=` de una contraseña base64 deben ir codificados):
```bash
node -e "console.log(encodeURIComponent(process.argv[1]))" 'LA_CONTRASEÑA_GENERADA'
```

Nuevo `DATABASE_URL`:
```
DATABASE_URL=postgres://app_<app>:CONTRASEÑA_CODIFICADA@172.20.1.30:6432/<basededatos>
```

### Paso 9 — Reiniciar el proceso de la app

Con el gestor de procesos que corresponda (`systemctl`, `pm2`, etc.) — **editar el `.env` no basta**, hay que reiniciar el proceso para que tome la variable nueva.

### Paso 10 — Confirmar que la app real está usando PgBouncer

`pg_stat_activity` en Postgres **no sirve** para esto (todo se ve como `127.0.0.1`, PgBouncer no preserva la IP real). Usar en su lugar:

```bash
# Opción A: revisar el historial del log de PgBouncer (mejor si la app usa conexiones cortas)
sudo grep "<basededatos>" /var/log/pgbouncer/pgbouncer.log | tail -n 40

# Opción B: ver clientes conectados en este momento
psql "host=172.20.1.30 port=6432 dbname=pgbouncer user=pgbouncer_auth" -c "SHOW CLIENTS;" | grep "app_<app>"

# Opción C (la más directa): desde el servidor de la app, confirmar el puerto real de conexión
ss -tnp | grep 6432
```
Buscar una IP real de origen (la del servidor de la app), no `127.0.0.1`.
