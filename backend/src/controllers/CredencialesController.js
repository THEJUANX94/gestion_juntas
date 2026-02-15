import bcrypt from "bcryptjs";
import { Usuario } from "../model/usuarioModel.js";
import { logOperation } from "../utils/logger.js";
import jwt from "jsonwebtoken";
import { sendMail } from "../utils/mailer.js";
import { Credenciales } from "../model/CredencialesModel.js";

// --- Umbral de Puntuación para reCAPTCHA v3 ---
// Si la puntuación es inferior a 0.5, se considera sospechoso.
const RECAPTCHA_THRESHOLD = 0.2; 

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

        // 1. Llamar a la API de verificación de reCAPTCHA
        // const captchaResponse = await fetch(
        //     `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${captcha}`,
        //     { method: "POST" }
        // );

        // const captchaData = await captchaResponse.json();

        // console.log("Respuesta Completa de reCAPTCHA:", captchaData);
        
        // // 2. VERIFICACIÓN DE RECAPTCHA V3 (Score y Success)
        // // Se verifica que sea exitoso Y que la puntuación esté por encima del umbral.
        // const isHuman = captchaData.success && captchaData.score >= RECAPTCHA_THRESHOLD;
        
        // // Opcional: Verificar la 'action' (si la envías desde el front-end)
        // // const isActionCorrect = captchaData.action === 'login'; 

        // if (!isHuman) { // || !isActionCorrect) {
        //     logOperation(
        //         "LOGIN_FALLIDO",
        //         login,
        //         { 
        //             motivo: `Verificación Captcha v3 fallida. Score: ${captchaData.score || 'N/A'} (Umbral: ${RECAPTCHA_THRESHOLD})`, 
        //             ip: req.ip || 'N/A' 
        //         },
        //         "error"
        //     );

        //     // Se devuelve un error genérico para no dar pistas
        //     return res.status(401).json({ error: "Verificación de seguridad fallida. Inténtalo de nuevo." });
        // }
        // Fin de la verificación de reCAPTCHA V3

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
        await credencial.update({
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
                rol: user.IDRol,
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

// NOTA: Las funciones forgotPassword y resetPassword NO necesitan cambios, 
// ya que no usan el parámetro 'captcha'.

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(`[FORGOT] Solicitud de restablecimiento recibida para email: ${email}`);

    try {
        const user = await Usuario.findOne({
            where: { Correo: email }
        });

        if (!user) {
            console.log(`[FORGOT] Usuario no encontrado para el correo: ${email}. Enviando respuesta genérica.`);
            return res.status(200).json({
                message: 'Si el correo está registrado, recibirás un enlace de restablecimiento.'
            });
        }

        const numeroIdentificacion = user.numeroIdentificacion;
        console.log(`[FORGOT] Usuario encontrado. ID: ${numeroIdentificacion}, Correo: ${user.Correo}.`);

        const resetToken = jwt.sign(
            { id: numeroIdentificacion },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password/${resetToken}`;
        console.log(`[FORGOT] Enlace de restablecimiento generado: ${resetUrl}`);

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

        console.log(`[FORGOT] Intentando enviar correo a: ${user.Correo} desde: ${process.env.EMAIL_USER}`);

        await sendMail(mailOptions);

        console.log(`[FORGOT] ÉXITO: El correo se envió con éxito (o fue aceptado por el transportador).`)

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
        console.error(`[FORGOT] ERROR CRÍTICO en forgotPassword: ${error.message}`);

        logOperation(
            "FORGOT_PASSWORD_ERROR",
            { email },
            { error: error.message },
            "error"
        );
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;
    let numeroIdentificacion = null; // Corregido: inicializar userId o numeroIdentificacion

    console.log(`[RESET] Solicitud de restablecimiento recibida. Token: ${token.substring(0, 10)}...`);

    if (!newPassword || newPassword.length < 8) {
        console.error("[RESET] Error: Contraseña no cumple el mínimo de 8 caracteres.");
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        // Corregido: jwt.verify debe decodificar a `payload`
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Corregido: El token del front-end tiene la propiedad 'id', no 'numeroIdentificacion'
        // Revisar el código del front-end, pero basado en la línea 316, es probable que sea 'id'
        // Si el token original era { id: user.numeroIdentificacion, rol: user.IDRol }
        // Y el token de restablecimiento era { id: numeroIdentificacion }
        numeroIdentificacion = payload.id; 
        console.log(`[RESET] Token verificado. IDUsuario: ${numeroIdentificacion}`);

        const credencial = await Credenciales.findOne({
            where: { numeroIdentificacion: numeroIdentificacion }
        });

        if (!credencial) {
            console.error(`[RESET] Error: Credencial no encontrada para IDUsuario: ${numeroIdentificacion}`);
            return res.status(404).json({ message: 'Credencial no encontrada o token inválido.' });
        }

        console.log(`[RESET] Credencial encontrada. Hasheando nueva contraseña...`);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        credencial.Contraseña = hashedPassword;
        await credencial.save();

        console.log(`[RESET] ÉXITO: Contraseña actualizada para IDUsuario: ${numeroIdentificacion}`);

        logOperation(
            "RESET_PASSWORD_SUCCESS",
            { numeroIdentificacion: numeroIdentificacion },
            { message: `Contraseña restablecida exitosamente para usuario ID: ${numeroIdentificacion}` },
            "info"
        );
        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });

    } catch (error) {
        console.error(`[RESET] ERROR CRÍTICO en resetPassword (JWT o DB): ${error.message}`);

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

export const ChangePassword = async (req, res) => {
    // El frontend ahora envía estos datos en el cuerpo de la solicitud (req.body)
    const { numeroIdentificacion, newPassword } = req.body;

    console.log(`[RESET] Solicitud de restablecimiento directa para ID: ${numeroIdentificacion}`);

    // 1. Validaciones de entrada
    if (!numeroIdentificacion) {
        return res.status(400).json({ message: 'El número de identificación es requerido.' });
    }

    if (!newPassword || newPassword.length < 8) {
        console.error("[RESET] Error: Contraseña no cumple el mínimo de 8 caracteres.");
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        // 2. Buscar la credencial por numeroIdentificacion
        const credencial = await Credenciales.findOne({
            where: { numeroIdentificacion: numeroIdentificacion }
        });

        if (!credencial) {
            console.error(`[RESET] Error: Credencial no encontrada para IDUsuario: ${numeroIdentificacion}`);
            return res.status(404).json({ message: 'Usuario no encontrado en el sistema.' });
        }

        console.log(`[RESET] Credencial encontrada. Hasheando nueva contraseña...`);

        // 3. Hashear la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 4. Actualizar y guardar
        credencial.Contraseña = hashedPassword;
        await credencial.save();

        console.log(`[RESET] ÉXITO: Contraseña actualizada para IDUsuario: ${numeroIdentificacion}`);

        // 5. Registrar la operación
        logOperation(
            "RESET_PASSWORD_SUCCESS",
            { numeroIdentificacion: numeroIdentificacion },
            { message: `Contraseña restablecida exitosamente para usuario ID: ${numeroIdentificacion}` },
            "info"
        );

        res.status(200).json({ message: 'Contraseña restablecida con éxito.' });

    } catch (error) {
        console.error(`[RESET] ERROR CRÍTICO en resetPassword: ${error.message}`);

        logOperation(
            "RESET_PASSWORD_ERROR",
            { numeroIdentificacion: numeroIdentificacion || 'N/A' },
            { error: error.message },
            "error"
        );

        res.status(500).json({
            message: 'Ocurrió un error interno al intentar restablecer la contraseña.',
            error: error.message
        });
    }
};
