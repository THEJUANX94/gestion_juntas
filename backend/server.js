import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import http from 'http';
import { Server } from 'socket.io';
import { Tail } from 'tail';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from "cookie-parser";
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { sequelize } from "./src/config/database.js";
import usuariosRoutes from "./src/routes/usuariosRoutes.js";
import firmasRoutes from "./src/routes/firmasRoutes.js";
import CredencialesRoutes from "./src/routes/CredencialesRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";
import { logger } from './src/utils/logger.js';
import { Asociaciones } from "./src/config/asociacionesBD.js";
import { verifyMailerConnection } from "./src/utils/mailer.js";

dotenv.config();

const ID_ROL_ADMINISTRADOR = "4d41852c-4ee3-4798-bbe0-ca3a65660666";

const allowedOrigins = [
  'http://172.20.1.31',
  'http://localhost:5173',
  'https://certificacionalcaldes.boyaca.gov.co',
  'https://certificacionalcaldes.boyaca.gov.co:3000'
];

const corsOptions = {
  origin: (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    } 
  },
  credentials: true
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.resolve('./src/utils/logs/app.log');

if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, '');
}

const app = express();

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`Solicitud recibida en: ${req.url}`);
    next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // Usamos la lista de allowedOrigins ya definida para evitar discrepancias entre
    // el cliente y el valor de process.env.CLIENT_ORIGIN. Esto también habilita
    // el envío de cookies en el handshake (credentials: true).
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use((req, res, next) => {
  logger.info({
    message: 'Request received',
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

let logTail;

try {
  logTail = new Tail(logFilePath, {
    follow: true,
    fromStart: false
  });

  logTail.on('line', (data) => {
    try {
      const logEntry = JSON.parse(data);
      io.to('admins').emit('new_log', logEntry);

    } catch (e) {
      io.to('admins').emit('new_log', {
        timestamp: new Date().toISOString(),
        level: 'RAW',
        message: data
      });
    }
  });

  logTail.on('error', (error) => {
    logger.error({ message: 'Error en Live-Tail', details: error.message });
    io.to('admins').emit('system_message', { message: 'Error de lectura del archivo de logs en el servidor.' });
  });

} catch (e) {
  console.error("No se pudo inicializar la librería Tail. Asegúrate de que el archivo de logs exista.", e);
}


// --- 3. LÓGICA DE SOCKET.IO PARA ADMINISTRADORES ---

io.on('connection', (socket) => {

  // 🛑 CAMBIO CLAVE: Leer la cookie del handshake de la petición
  const token = socket.request.cookies.auth_token;

  let esAdministrador = false;

  if (token) {
    try {
      // 1. Verificar y decodificar el token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 2. Comprobar si el rol decodificado es el de Administrador
      if (decoded.rol === ID_ROL_ADMINISTRADOR) {
        esAdministrador = true;
        socket.usuario = decoded;
      }
    } catch (err) {
      // El token es inválido (expirado, modificado, firma incorrecta)
      logger.error({ message: 'Error al verificar JWT en Socket.IO', error: err.message, socketId: socket.id });
    }
  }

  if (esAdministrador) {
    socket.join('admins');
    logger.info({ message: `Admin (ID: ${socket.usuario.id}) connected to logs socket.`, socketId: socket.id });
    socket.emit('system_message', { message: 'Conectado al feed de logs en vivo.' });

    // ... (Tu código para logs históricos) ...

  } else {
    // Desconectar si no hay token, si es inválido o si no es administrador
    socket.disconnect(true);
    logger.warn({ message: 'Unauthenticated or non-admin user attempted to connect to logs socket.', socketId: socket.id });
    return;
  }

  socket.on('disconnect', () => {
    logger.info({ message: 'Client disconnected.', socketId: socket.id });
  });
});

// --- Verificación de sesión (JWT en cookie) ---
app.get("/api/auth/verify", (req, res) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ valid: false, message: "No hay token en la cookie" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({
      valid: true,
      user: decoded,
      message: "Token válido",
    });
  } catch (error) {
    res.status(401).json({
      valid: false,
      message: "Token inválido o expirado",
      error: error.message,
    });
  }
});

app.use("/api/usuarios", usuariosRoutes);
app.use("/api/firmas", firmasRoutes);
app.use("/api/login", CredencialesRoutes)
app.use("/api/auth", authRoutes);

const frontendPath = path.join(__dirname, '../frontend/dist');

// 1. Servir archivos estáticos 
app.use(express.static(frontendPath));

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;

(async () => {
  console.log(" Intentando conectar a la base de datos...");

  try {
    await sequelize.authenticate();
    console.log(" Conectado correctamente a la base de datos PostgreSQL");

    Asociaciones();
    await verifyMailerConnection();

    console.log(" Modelos sincronizados con la base de datos");

    server.listen(PORT, () => {
    });

  } catch (error) {
    console.error(" Error al conectar:");
    console.error("Mensaje:", error.message);
    console.error("Detalles:", error);
    logger.error({ message: 'Database connection failed', error: error.message });
    process.exit(1);
  }
})();