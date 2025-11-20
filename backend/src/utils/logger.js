import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}
const logFilePath = path.join(logDirectory, 'app.log');

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: logFilePath,
      maxsize: 5242880,
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

export const logOperation = (operation, userDetails = {}, changes = null, level = 'info') => {

    const logPayload = {
        message: `Operación de Negocio: ${operation}`,
        operation: operation,
        userId: userDetails.IDUsuario || userDetails.id || 'N/A',
        userName: userDetails.PrimerNombre ? `${userDetails.PrimerNombre} ${userDetails.PrimerApellido}` : 'Desconocido',
        userEmail: userDetails.Correo || 'N/A',
        changes: changes,

        userDetails: userDetails
    };

    logger.log(level, logPayload);
};