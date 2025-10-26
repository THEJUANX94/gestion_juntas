import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = 'http://172.20.1.31:3000';
const MAX_LOGS = 500;

const styles = {
    body: {
        fontFamily: 'Consolas, monospace',
        backgroundColor: '#282c34',
        color: '#ffffff',
        padding: '20px',
        minHeight: '100vh',
    },
    logsContainer: {
        maxHeight: '80vh',
        overflowY: 'scroll',
        border: '1px solid #61afef',
        padding: '10px',
    },
    logEntry: {
        padding: '5px 0',
        borderBottom: '1px dashed #3e4451',
        display: 'flex',
        alignItems: 'center',
    },
    logEntryLast: {
        borderBottom: 'none',
    },
    logLevel: {
        fontWeight: 'bold',
        width: '80px',
        textAlign: 'center',
        padding: '0 5px',
        borderRadius: '3px',
        flexShrink: 0,
    },
    logTimestamp: {
        color: '#56b6c2',
        width: '200px',
        flexShrink: 0,
    },
    logMessage: {
        flexGrow: 1,
        wordBreak: 'break-all',
        marginLeft: '10px',
    },
    logColors: {
        INFO: { backgroundColor: '#98c379', color: '#1e2127' },
        ERROR: { backgroundColor: '#e06c75', color: '#1e2127' },
        RAW: { backgroundColor: '#c678dd', color: '#1e2127' },
        SYSTEM: { backgroundColor: '#61afef', color: '#1e2127' },
    }
};

const Logs = () => {
    const [logs, setLogs] = useState([]);

    const addLogEntry = useCallback((log) => {
        // ...
        // El log ya es un objeto, lo estamos recibiendo estructurado
        const level = log.level ? String(log.level).toUpperCase() : 'SYSTEM';
        const newLog = {
            timestamp: log.timestamp || new Date().toISOString(),
            level: level,
            // Aquí NO uses log.message, guarda el objeto completo si quieres mostrar los detalles:
            data: log, // <--- Guardamos el objeto completo del log
            key: Date.now() + Math.random(),
        };
        setLogs(prevLogs => [newLog, ...prevLogs].slice(0, MAX_LOGS));
    }, []);

    // ... useEffect ...

    const renderLogMessage = (logData) => {
        const userName = logData.userName || 'Desconocido';
        const operation = logData.operation || 'Acción General';
        const changes = logData.changes;
        const message = logData.message || 'Sin mensaje principal';

        let changesDetail = '';
        if (changes) {
            try {
                // Formatea los cambios como una lista si es un objeto/array
                changesDetail = `<br/><span style="color:#e5c07b;">Cambios:</span>`;
                if (Array.isArray(changes)) {
                    changesDetail += changes.map(c => ` ${c.campo}: ${c.anterior} -> ${c.nuevo}`).join(', ');
                } else if (typeof changes === 'object' && changes !== null) {
                    changesDetail += Object.entries(changes)
                        .map(([key, value]) => ` **${key}**: ${JSON.stringify(value)}`)
                        .join(', ');
                } else {
                    changesDetail += ` ${String(changes)}`;
                }
            } catch (e) {
                changesDetail = `<br/><span style="color:#e06c75;">Error al formatear cambios: ${String(changes)}</span>`;
            }
        }
        
        // Construye el mensaje a mostrar
        const displayMessage = `<span style="color:#61afef;">${userName}</span>: **${operation}** (${message})`;

        return (
            <span dangerouslySetInnerHTML={{ __html: displayMessage + changesDetail }} />
        );
    };

    return (
        <div style={styles.body}>
            <h1>Logs</h1>
            <div id="logs-container" style={styles.logsContainer}>
                {logs.map((log, index) => {
                    const levelStyle = styles.logColors[log.level] || styles.logColors.SYSTEM;
                    const isLast = index === logs.length - 1;
                    
                    // Comprobación de que 'log.data' exista y sea un objeto
                    const logData = log.data && typeof log.data === 'object' ? log.data : log;

                    return (
                        <div
                            key={log.key}
                            style={{ ...styles.logEntry, ...(isLast ? styles.logEntryLast : {}) }}
                        >
                            <span style={styles.logTimestamp}>{log.timestamp.slice(11, 19)}</span>
                            <span style={{ ...styles.logLevel, ...levelStyle }}>
                                {log.level.padEnd(5)}
                            </span>
                            <span style={styles.logMessage}>
                                {renderLogMessage(logData)} {/* <-- Usamos la nueva función */}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Logs;