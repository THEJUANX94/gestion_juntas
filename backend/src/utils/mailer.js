import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const verifyMailerConnection = async () => {
    try {
        await transporter.verify();
        console.log("[MAILER] Conexión SMTP verificada y lista.");
        return true;
    } catch (error) {
        console.error("[MAILER] FALLO CRÍTICO DE CONEXIÓN SMTP:", error.message);
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