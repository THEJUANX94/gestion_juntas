import bcrypt from "bcryptjs";
import { Credenciales } from "../model/credencialesModel.js";
import { Usuario } from "../model/usuarioModel.js";
import { logOperation } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/mailer.js";

export const loginUsuario = async (req, res) => {
    try {
        const { login, contraseña, captcha } = req.body;

        if (!login || !contraseña || !captcha) {
            logOperation(
                "LOGIN_FALLIDO",
                login,
                { motivo: "Datos incompletos (login, contraseña o captcha)", ip: req.ip || 'N/A' },
                "error"
            );

            return res.status(400).json({ error: "Datos incompletos." });
        }
        const captchaResponse = await fetch(
            `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`,
            { method: "POST" }
        );

        const captchaData = await captchaResponse.json();
        if (!captchaData.success) {
            logOperation(
                "LOGIN_FALLIDO",
                login,
                { motivo: `Captcha inválido`, score: captchaData.score, ip: req.ip || 'N/A' },
                "error"
            );

            return res.status(400).json({ error: "Captcha inválido" });
        }
        const credencial = await Credenciales.findOne({
            where: {
                Login: login,
            },
        });

        if (!credencial) {
            logOperation(
                "LOGIN_FALLIDO",
                login,
                { motivo: "Usuario no encontrado", ip: req.ip || 'N/A' },
                "error"
            );

            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        const isMatch = await bcrypt.compare(contraseña, credencial.Contraseña);
        if (!isMatch) {
            logOperation(
                "LOGIN_FALLIDO",
                { numeroIdentificacion: credencial.numeroIdentificacion, Login: login },
                { motivo: "Contraseña incorrecta", ip: req.ip || 'N/A' },
                "error"

            );

            return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
        }

        const user = await Usuario.findByPk(credencial.numeroIdentificacion);

        if (!user) {
            logOperation(
                "LOGIN_INTEGRITY_FAIL",
                { numeroIdentificacion: credencial.numeroIdentificacion, Login: login },
                { motivo: "Credencial encontrada pero usuario asociado no existe", ip: req.ip || 'N/A' },
                "error"
            );
            return res.status(401).json({ error: "Error de autenticación. Contacte soporte." });
        }
        const previousLogin = user.ultimo_inicio_sesion; // Guardamos el valor anterior para el log
        const currentLoginTime = new Date();
        await user.update({
            ultimo_inicio_sesion: new Date()
        });
        const token = jwt.sign(
            {
                id: user.numeroIdentificacion,
                rol: user.IDRol,
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000 // Expira en 8 horas

        });
        logOperation(
            "LOGIN_EXITOSO",
            user.toJSON(),
            {
                ultimo_inicio_sesion_anterior: previousLogin,
                ultimo_inicio_sesion_nuevo: currentLoginTime,
                ip: req.ip || 'N/A'
            },
            "info"
        );
        res.json({
            message: "Login exitoso",
            user: {
                id: user.numeroIdentificacion,
                nombre: `${user.PrimerNombre} ${user.PrimerApellido}`,
                correo: user.Correo,
                ultimo_inicio_sesion: user.ultimo_inicio_sesion
            },
        });

    } catch (err) {
        logOperation(
            "LOGIN_ERROR_SERVIDOR",
            { error: err.message, stack: err.stack, ip: req.ip || 'N/A' },
            "error"
        );
        res.status(500).json({ error: "Error interno del servidor" });

    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(`[FORGOT] Solicitud de restablecimiento recibida para email: ${email}`); // 🛑 Log 1

    try {
        const user = await Usuario.findOne({
            where: { Correo: email } 
        });

        if (!user) {
            console.log(`[FORGOT] Usuario no encontrado para el correo: ${email}. Enviando respuesta genérica.`); // 🛑 Log 2
            return res.status(200).json({
                message: 'Si el correo está registrado, recibirás un enlace de restablecimiento.'
            });
        }

        const numeroIdentificacion = user.numeroIdentificacion;
        console.log(`[FORGOT] Usuario encontrado. ID: ${numeroIdentificacion}, Correo: ${user.Correo}.`); // 🛑 Log 3

        const resetToken = jwt.sign(
            { id: numeroIdentificacion },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password/${resetToken}`;
        console.log(`[FORGOT] Enlace de restablecimiento generado: ${resetUrl}`); // 🛑 Log 4

        // 5. Configurar y enviar el correo
        const mailOptions = {
            to: user.Correo,
            from: process.env.EMAIL_USER,
            subject: 'Recuperación de Contraseña',
            html: `
            <h1>Restablecimiento de Contraseña</h1>
            <p>Estimado usuario, haga click en el siguiente enlace para establecer una nueva contraseña:</p>
            <a href="${resetUrl}">Cambiar Contraseña</a>
            <p>Este enlace expirará en 15 minutos. Si no solicitó esto, ignore este correo.</p>`
        };
        
        console.log(`[FORGOT] Intentando enviar correo a: ${user.Correo} desde: ${process.env.EMAIL_USER}`); // 🛑 Log 5
        
        // 🛑 Punto de Falla Probable: Si sendMail falla silenciosamente, 
        // el error debería ser capturado si sendMail relanza la excepción.
        await sendMail(mailOptions); 
        
        console.log(`[FORGOT] ÉXITO: El correo se envió con éxito (o fue aceptado por el transportador).`); // 🛑 Log 6

        logOperation(
            "FORGOT_PASSWORD_REQUEST",
            { numeroIdentificacion: numeroIdentificacion, Correo: user.Correo },
            { message: "Enlace de restablecimiento enviado" },
            "info"
        );

        res.status(200).json({
            message: 'Si el correo está registrado, recibirás un enlace de restablecimiento.'
        });

    } catch (error) {
        console.error(`[FORGOT] ERROR CRÍTICO en forgotPassword: ${error.message}`); // 🛑 Log 7
        
        logOperation(
            "FORGOT_PASSWORD_ERROR",
            { email },
            { error: error.message },
            "error"
        );
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ---------------------------------------------------------------------
// 🛑 FUNCIÓN MODIFICADA: resetPassword con Console Logs
// ---------------------------------------------------------------------
export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    let userId = null;
    
    console.log(`[RESET] Solicitud de restablecimiento recibida. Token: ${token.substring(0, 10)}...`); // 🛑 Log 8

    if (!newPassword || newPassword.length < 8) {
        console.error("[RESET] Error: Contraseña no cumple el mínimo de 8 caracteres."); // 🛑 Log 9
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        // 1. Verificar el Token JWT y obtener el IDUsuario
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        numeroIdentificacion = payload.numeroIdentificacion;
        console.log(`[RESET] Token verificado. IDUsuario: ${numeroIdentificacion}`); // 🛑 Log 10

        // 2. Buscar la CREDENCIAL asociada al IDUsuario
        const credencial = await Credenciales.findOne({
            where: { numeroIdentificacion: numeroIdentificacion }
        });

        if (!credencial) {
            console.error(`[RESET] Error: Credencial no encontrada para IDUsuario: ${numeroIdentificacion}`); // 🛑 Log 11
            return res.status(404).json({ message: 'Credencial no encontrada o token inválido.' });
        }
        
        console.log(`[RESET] Credencial encontrada. Hasheando nueva contraseña...`); // 🛑 Log 12

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar la contraseña en la tabla CREDENCIALES
        credencial.Contraseña = hashedPassword;
        await credencial.save();
        
        console.log(`[RESET] ÉXITO: Contraseña actualizada para IDUsuario: ${numeroIdentificacion}`); // 🛑 Log 13

        logOperation(
            "RESET_PASSWORD_SUCCESS",
            { numeroIdentificacion: numeroIdentificacion },
            { message: `Contraseña restablecida exitosamente para usuario ID: ${numeroIdentificacion}` },
            "info"
        );
        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });

    } catch (error) {
        console.error(`[RESET] ERROR CRÍTICO en resetPassword (JWT o DB): ${error.message}`); // 🛑 Log 14
        
        logOperation(
            "RESET_PASSWORD_ERROR",
            { numeroIdentificacion: numeroIdentificacion || 'N/A' },
            { error: error.message },
            "error"
        );
        res.status(400).json({
            message: 'El enlace de restablecimiento es inválido o ha expirado. Por favor, solicite uno nuevo.',
            error: error.message
        });
    }
};