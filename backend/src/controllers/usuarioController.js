import { Usuario } from "../model/usuarioModel.js";
import { Rol } from "../model/rolModel.js";
import { Firma } from "../model/firmaModel.js";
import { logOperation } from "../utils/logger.js";
import { Op } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { Credenciales } from "../model/credencialesModel.js";
import { TipoDocumento } from '../model/tipoDocumentoModel.js';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const firmasDir = path.resolve(__dirname, "../../firmas");

export const crearUsuario = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const firmaFile = req.file; 
    console.log('Received file (firma):', firmaFile);

    const {
      NombreTipoDocumento,
      NumeroIdentificacion,
      PrimerApellido,
      SegundoApellido,
      PrimerNombre,
      SegundoNombre,
      Sexo,
      TipoSangre,
      FechaNacimiento,
      NombreRol,
      Correo,
      Celular,
      Usuario: Login,       
      Contrasena,           
      Contraseña            
    } = req.body;

    console.log('Extracted NombreRol:', NombreRol);

    const requiredFields = {
      NumeroIdentificacion,
      PrimerApellido,
      PrimerNombre,
      Correo,
      NombreRol
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    const ROL_MANDATARIO = "Mandatario";
    const isMandatario = NombreRol === ROL_MANDATARIO;
    
    if (isMandatario && !firmaFile) {
        missingFields.push('Firma');
    }

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
      return res.status(400).json({
        message: `Faltan campos requeridos: ${missingFields.join(', ')}`,
        fields: missingFields
      });
    }

    const tipoDocumento = await TipoDocumento.findOne({
      where: { NombreTipo: NombreTipoDocumento }
    });

    if (!tipoDocumento) {
      return res.status(400).json({ message: `Tipo de documento no válido` });
    }

    console.log('Looking for role:', NombreRol);
    
    const rol = await Rol.findOne({
      where: { NombreRol: NombreRol }
    });

    if (!rol) {
      return res.status(400).json({ message: `Rol no válido` });
    }

    console.log('Found role:', rol.toJSON());

    const existingUser = await Usuario.findOne({
      where: {
        [Op.or]: [
          { Correo },
          { NumeroIdentificacion }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        message: existingUser.Correo === Correo 
          ? "El correo ya está registrado"
          : "El número de identificación ya está registrado"
      });
    }

    const newUser = await Usuario.create({
      IDTipoDocumento: tipoDocumento.IDTipoDocumento,
      NumeroIdentificacion,
      PrimerApellido,
      SegundoApellido,
      PrimerNombre,
      SegundoNombre,
      Sexo,
      TipoSangre,
      FechaNacimiento,
      IDRol: rol.IDRol,
      Correo,
      Celular
    });

    if (isMandatario && firmaFile) {
    try {
        if (!fs.existsSync(firmasDir)) {
            fs.mkdirSync(firmasDir, { recursive: true });
        }

        const extension = path.extname(firmaFile.originalname) || ".png";
        const nuevoNombre = `${uuidv4()}${extension}`;
        const destino = path.join(firmasDir, nuevoNombre);

        fs.copyFileSync(firmaFile.path, destino);
        fs.unlinkSync(firmaFile.path); // Borra el archivo temporal original

        // 3. Calcular ubicación relativa para la DB
        const ubicacionFirma = path.relative(process.cwd(), destino);

        await Firma.create({
            NumeroIdentificacion: newUser.NumeroIdentificacion,
            Ubicacion: ubicacionFirma
        });

        console.log(`Firma guardada en: ${ubicacionFirma}`);
    } catch (errFirma) {
        console.error("Error detallado al procesar firma:", errFirma);
        return res.status(500).json({
            message: "Usuario creado, pero hubo un error con el archivo de la firma",
            error: errFirma.message
        });
    }
}

    if (NombreRol === "Administrador") {
      try {
        const loginFinal = Login || Correo || NumeroIdentificacion;
        const passwordPlano = Contrasena || Contraseña; 

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(passwordPlano, saltRounds);

        await Credenciales.create({
          Login: loginFinal,
          numeroIdentificacion: NumeroIdentificacion,
          Contraseña: hashedPassword
        });

        console.log(`Credenciales creadas para Administrador (${loginFinal})`);
      } catch (credError) {
        console.error("Error al crear credenciales:", credError);
        return res.status(500).json({
          message: "Usuario creado, pero error al crear credenciales",
          error: credError.message
        });
      }
    }

    const userWithRole = await Usuario.findByPk(newUser.NumeroIdentificacion, {
      include: [{ 
        model: Rol,
        as: 'RolInfo',
        attributes: ['IDRol', 'NombreRol']
      }]
    });

    logOperation(
      "USUARIO_CREADO",
      req.user || {},
      {
        NumeroIdentificacion: newUser.NumeroIdentificacion,
        Correo: newUser.Correo,
        Rol: rol.NombreRol
      },
      "info"
    );

    return res.status(201).json(userWithRole);

  } catch (error) {
    console.error("Error al crear usuario:", error);
    logOperation(
      "ERROR_CREAR_USUARIO",
      req.user || {},
      { error: error.message, body: req.body },
      "error"
    );
    return res.status(500).json({
      message: "Error al crear usuario",
      error: error.message
    });
  }
};

export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { model: Rol, as: "RolInfo", attributes: ["NombreRol"] },
        { model: Firma, attributes: ["Ubicacion", "FechaCreacion"] },
      ],
    });

    res.json(usuarios);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    logOperation(
      "ERROR_OBTENER_USUARIOS",
      req.user || {},
      { error: err.message },
      "error"
    );
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const obtenerMandatarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        { 
          model: Rol, 
          as: "RolInfo", 
          attributes: ["NombreRol"],
          where: { NombreRol: "Mandatario" } 
        },
        { 
          model: Firma, 
          // Importante: Incluye la columna que define si está activa (ej: 'Activa')
          attributes: ["Activa", "Ubicacion", "FechaCreacion"] 
        },
      ],
    });

    // Aplanamos la respuesta para el frontend
    const respuesta = usuarios.map((u) => {
      // Convertimos la instancia de Sequelize a un objeto plano de JS
      const userJSON = u.toJSON(); 
      
      return {
        IDUsuario: userJSON.IDUsuario,
        NombreCompleto: userJSON.NombreCompleto,
        Identificacion: userJSON.Identificacion,
        // Accedemos a la relación Firma. Si no existe, es false.
        FirmaActiva: userJSON.Firma ? userJSON.Firma.Activa : false,
      };
    });

    res.json(respuesta); // Esto siempre devolverá un Array [ ... ]
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const actualizarEstadoFirma = async (req, res) => {
  const { idUsuario } = req.params;
  const { Activo } = req.body; // El frontend envía { "Activo": true/false }

  try {
    const firma = await Firma.findOne({ where: { IDUsuario: idUsuario } });

    if (!firma) {
      return res.status(404).json({ error: "El mandatario no tiene una firma registrada." });
    }

    // Actualizamos la columna 'Activa'
    firma.Activa = Activo; 
    await firma.save();

    res.json({ 
      message: "Estado de firma actualizado", 
      FirmaActiva: firma.Activa // Devolvemos el nombre que el frontend espera
    });
  } catch (err) {
    console.error("Error al actualizar firma:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const verificarIdentificacion = async (req, res) => {
  try {
    const { NumeroIdentificacion } = req.params;

    const usuario = await Usuario.findOne({
      where: { NumeroIdentificacion },
    });

    res.json({ existe: !!usuario });
  } catch (err) {
    console.error("Error al verificar identificación:", err);
    res.status(500).json({ error: "Error al verificar identificación" });
  }
};

export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { NumeroIdentificacion } = req.params;

    if (!NumeroIdentificacion) {
      return res.status(400).json({ error: "IDUsuario no proporcionado" });
    }

    const usuario = await Usuario.findByPk(NumeroIdentificacion, {
      include: [
        { model: Rol, as: "RolInfo", attributes: ["NombreRol"] },
        { model: Firma, attributes: ["Ubicacion", "FechaCreacion"] },
      ],
    });

    if (!usuario) {
      logOperation(
        "CONSULTA_USUARIO_FALLIDA",
        req.user || {},
        { NumeroIdentificacion, motivo: "Usuario no encontrado" },
        "info"
      );
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(usuario);
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    logOperation(
      "ERROR_OBTENER_USUARIO_POR_ID",
      req.user || {},
      { error: err.message, NumeroIdentificacion: req.params.NumeroIdentificacion },
      "error"
    );
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

export const actualizarUsuario = async (req, res) => {
  const userAdmin = req.user || {};
  const { NumeroIdentificacion } = req.params;
  const { Login, Contraseña, ...datosUsuario } = req.body; 

  let credencialesActualizadas = null;

  try {
    if (!NumeroIdentificacion) {
      logOperation(
        "ACTUALIZAR_USUARIO_FALLIDO",
        userAdmin,
        { motivo: "NumeroIdentificacion no proporcionado" },
        "error"
      );
      return res.status(400).json({ error: "NumeroIdentificacion no proporcionado" });
    }

    const usuario = await Usuario.findByPk(NumeroIdentificacion);
    if (!usuario) {
      logOperation(
        "ACTUALIZAR_USUARIO_FALLIDO",
        userAdmin,
        { motivo: "Usuario no encontrado", NumeroIdentificacion },
        "error"
      );
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const actualizado = await usuario.update(datosUsuario);

    if (Login || Contraseña) {
      const datosCredenciales = {};

      if (Login) {
        datosCredenciales.Login = Login;
      }

      if (Contraseña) {
        const saltRounds = 10;
        datosCredenciales.Contraseña = await bcrypt.hash(Contraseña, saltRounds);
        datosCredenciales.Contraseña = Contraseña; 
      }

      const credenciales = await Credenciales.findOne({ where: { numeroIdentificacion: NumeroIdentificacion } });

      if (credenciales) {
        const credencialesActualizadasData = await credenciales.update(datosCredenciales);
        credencialesActualizadas = {
            NumeroIdentificacion, 
            Login: credencialesActualizadasData.Login, 
            Contraseña: Contraseña ? 'ACTUALIZADA' : 'NO_CAMBIO' 
        };
      } else {
        logOperation(
            "ACTUALIZAR_CREDENCIALES_FALLIDO",
            userAdmin,
            { motivo: "Credenciales no encontradas para el NumeroIdentificacion", NumeroIdentificacion },
            "warning"
        );
      }
    }

    const tieneCambiosUsuario = Object.keys(actualizado.toJSON()).some(key => key in datosUsuario);

    if (tieneCambiosUsuario || credencialesActualizadas) {
      logOperation(
        "USUARIO_Y_CREDENCIALES_ACTUALIZADOS",
        userAdmin,
        { 
            usuarioAfectado: NumeroIdentificacion, 
            cambiosUsuario: tieneCambiosUsuario ? actualizado : 'SIN_CAMBIOS', 
            cambiosCredenciales: credencialesActualizadas || 'NO_APLICAN' 
        },
        "info"
      );
    } else {
      logOperation(
        "USUARIO_ACTUALIZADO_SIN_CAMBIOS",
        userAdmin,
        { usuarioAfectado: NumeroIdentificacion, dataEnviada: req.body },
        "info"
      );
    }

    res.json(actualizado); 

  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    logOperation(
      "ERROR_ACTUALIZAR_USUARIO_CRITICO",
      userAdmin,
      { 
        error: err.message, 
        NumeroIdentificacion, 
        body: req.body,
        cambiosCredenciales: credencialesActualizadas // Para saber si falló después de actualizar credenciales
      },
      "error"
    );
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

export const eliminarUsuario = async (req, res) => {
  const userAdmin = req.user || {};
  const { NumeroIdentificacion } = req.params;

  try {
    if (!NumeroIdentificacion) {
      logOperation(
        "ELIMINAR_USUARIO_FALLIDO",
        userAdmin,
        { motivo: "NumeroIdentificacion no proporcionado" },
        "error"
      );
      return res.status(400).json({ error: "NumeroIdentificacion no proporcionado" });
    }

    const usuario = await Usuario.findByPk(NumeroIdentificacion);
    if (!usuario) {
      logOperation(
        "ELIMINAR_USUARIO_FALLIDO",
        userAdmin,
        { motivo: "Usuario no encontrado", NumeroIdentificacion },
        "error"
      );
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuarioInfo = usuario.toJSON();

    const firmas = await Firma.findAll({ where: { NumeroIdentificacion } });
    let firmasEliminadas = 0;
    for (const firma of firmas) {
      const pathFirma = firma.Ubicacion;
      try {
        if (fs.existsSync(pathFirma)) {
          fs.unlinkSync(pathFirma);
          firmasEliminadas++;
        }
      } catch (errDel) {
        console.warn(`No se pudo eliminar la firma local: ${pathFirma}`, errDel.message);
      }
      await firma.destroy();
    }

    await usuario.destroy();

    logOperation(
      "USUARIO_ELIMINADO",
      userAdmin,
      {
        NumeroIdentificacion: usuarioInfo.NumeroIdentificacion,
        nombre: `${usuarioInfo.PrimerNombre} ${usuarioInfo.PrimerApellido}`,
        correo: usuarioInfo.Correo,
        firmasEliminadas,
      },
      "info"
    );

    res.json({ message: "Usuario y firmas eliminados correctamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    logOperation(
      "ERROR_ELIMINAR_USUARIO_CRITICO",
      userAdmin,
      { error: err.message, NumeroIdentificacion },
      "error"
    );
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};

export const verificarCorreo = async (req, res) => {
  try {
    const { correo } = req.params;

    if (!correo) {
      return res.status(400).json({
        message: "Correo no proporcionado",
      });
    }

    const count = await Usuario.count({
      where: { Correo: correo }
    });

    return res.json({ existe: count > 0 });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    logOperation(
      "ERROR_CREAR_USUARIO",
      req.user || {},
      { error: error.message },
      "error"
    );
    return res.status(500).json({
      message: "Error al crear usuario",
      error: error.message
    });
  }
};
