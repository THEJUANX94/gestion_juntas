import { Usuario } from "../model/usuarioModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Cargo } from "../model/cargoModel.js";
import { Comisiones } from "../model/comisionModel.js";
import { Junta } from "../model/juntaModel.js";


export const crearMandatario = async (req, res) => {
  try {
    const { id } = req.params;        // <-- ID de la junta enviado en la URL
    const idJunta = id;

    const {
      documento,
      tipoDocumento,
      expedido,
      nombre,
      apellido,
      genero,
      fNacimiento,
      residencia,
      telefono,
      profesion,
      email,
      fAfiliacion,
      periodo,
      cargo,
      comision
    } = req.body;

    // 1. Validar existencia de la Junta
    const existeJunta = await Junta.findByPk(idJunta);
    if (!existeJunta) {
      return res.status(400).json({ message: "La junta no existe" });
    }

    // 2. Buscar o crear usuario
    let usuario = await Usuario.findByPk(documento);

    if (!usuario) {
      usuario = await Usuario.create({
        NumeroIdentificacion: documento,
        TipoDocumento: tipoDocumento,
        Expedido: expedido,
        PrimerNombre: nombre,
        PrimerApellido: apellido,
        Sexo: genero,
        FechaNacimiento: fNacimiento,
        Residencia: residencia,
        Celular: telefono,
        Profesion: profesion,
        Correo: email,
        IDRol: "8d0784a1-7fc6-406a-903f-3b9bfd43ce16"
      });
    } else {
      await usuario.update({
        Expedido: expedido,
        Residencia: residencia,
        Celular: telefono,
        Profesion: profesion,
        Correo: email
      });
    }

    // 3. Validar cargo único
    if (cargo) {
      const existeCargo = await MandatarioJunta.findOne({
        where: {
          IDJunta: idJunta,
          IDCargo: cargo
        }
      });

      if (existeCargo) {
        return res.status(400).json({ message: "El cargo ya está asignado en esta junta" });
      }
    }

    // 4. Crear Mandatario
    const nuevoMandatario = await MandatarioJunta.create({
      NumeroIdentificacion: documento,
      IDJunta: idJunta,
      IDCargo: cargo || null,
      IDComision: comision || null,
      FechaInicioPeriodo: fAfiliacion,
      Periodo: periodo
    });

    res.json({
      message: "Mandatario creado correctamente",
      data: nuevoMandatario
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear el mandatario" });
  }
};




export const getMiembrosJunta = async (req, res) => {
  const { id } = req.params;

  try {
    const miembros = await MandatarioJunta.findAll({
      where: { IDJunta: id },
      include: [
        {
          model: Usuario,
          attributes: [
            "NumeroIdentificacion",
            "PrimerNombre",
            "SegundoNombre",
            "PrimerApellido",
            "SegundoApellido",
            "Sexo",
            "FechaNacimiento",
            "Celular",
            "Correo",
            "Residencia",
            "Profesion",
            "TipoDocumento",
            "Expedido"
          ]
        },
        {
          model: Cargo,
          attributes: ["NombreCargo"]
        },
        {
          model: Comision,
          attributes: ["Nombre"]
        }
      ]
    });

    // ---- FORMATEAR RESPUESTA ----
    const resultado = miembros.map(m => {
      const u = m.Usuario;

      // Calcular edad
      const nacimiento = new Date(u.FechaNacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - nacimiento.getFullYear();

      return {
        // Parte del encabezado
        cargo: m.Cargo?.NombreCargo || "",
        nombreCompleto: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),
        profesion: u.Profesion || "",
        
        // Información personal
        documento: u.NumeroIdentificacion,
        tipoDocumento: u.TipoDocumento,
        expedido: u.Expedido,
        genero: u.Sexo,
        edad,
        nacimiento: u.FechaNacimiento,

        // Cargo y comisión
        comision: m.Comision?.Nombre || "",
        periodo: `${m.FechaInicioPeriodo.getFullYear()}-${m.FechaFinPeriodo.getFullYear()}`,

        // Contacto
        residencia: u.Residencia,
        telefono: u.Celular,
        email: u.Correo
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error cargando miembros" });
  }
};
