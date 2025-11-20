import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // smtp.gmail.com
    port: process.env.EMAIL_PORT, // 587
    secure: false, // Correcto para el puerto 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// 🚀 SOLUCIÓN CLAVE: Event Listener para capturar errores de conexión SMTP
export const verifyMailerConnection = async () => { // 👈 Función de verificación
    try {
        await transporter.verify();
        console.log("✅ [MAILER] Conexión SMTP verificada y lista.");
        return true;
    } catch (error) {
        console.error("❌ [MAILER] FALLO CRÍTICO DE CONEXIÓN SMTP:", error.message);
        // Puedes salir de la aplicación o reintentar
        return false;
    }
};


export const sendMail = async (mailOptions) => {
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("[MAILER] Correo enviado: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("[MAILER] Error al enviar correo (en tiempo de ejecución):", error.message);
        throw new Error(`Fallo en el servicio de correo: ${error.message}`);
    }
};