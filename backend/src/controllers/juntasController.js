import { Junta } from "../model/juntaModel.js";
import { Lugar } from "../model/lugarModel.js";
import { Institucion } from "../model/institucionModel.js";
import { TipoJunta } from "../model/tipoJuntaModel.js";
import { Reconocida } from "../model/reconocidaModel.js";

export const crearJunta = async (req, res) => {
  try {
    const {
      razonSocial,
      direccion,
      numPersoneriaJuridica,
      fechaCreacion,
      fechaInicioPeriodo,
      fechaFinPeriodo,
      fechaAsamblea,
      tipoJunta,
      idMunicipio,
      idInstitucion,
      idReconocida,
      zona
    } = req.body;

    // ------------------------------------------
    // VALIDACIÓN DE CAMPOS OBLIGATORIOS
    // ------------------------------------------
    if (
      !razonSocial || !direccion || !numPersoneriaJuridica ||
      !fechaCreacion || !fechaInicioPeriodo || !fechaFinPeriodo ||
      !fechaAsamblea || !tipoJunta || !idMunicipio ||
      !idInstitucion || !zona
    ) {
      return res.status(400).json({
        message: "Todos los campos son obligatorios"
      });
    }

    // ------------------------------------------
    // VALIDAR EXISTENCIA DEL MUNICIPIO / LUGAR
    // ------------------------------------------
    const municipio = await Lugar.findByPk(idMunicipio);
    if (!municipio) {
      return res.status(400).json({
        message: "El municipio no existe"
      });
    }

    // ------------------------------------------
    // VALIDAR EXISTENCIA DE INSTITUCIÓN
    // ------------------------------------------
    const institucion = await Institucion.findByPk(idInstitucion);
    if (!institucion) {
      return res.status(400).json({
        message: "La institución no existe"
      });
    }

    // ------------------------------------------
    // VALIDAR QUE EL TIPO DE JUNTA EXISTA
    // ------------------------------------------
    const tipo = await TipoJunta.findByPk(tipoJunta);
    if (!tipo) {
      return res.status(400).json({
        message: "El tipo de junta no existe"
      });
    }

    // ------------------------------------------
    // VALIDAR DUPLICADO DE PERSONERÍA JURÍDICA
    // ------------------------------------------
    const existePersoneria = await Junta.findOne({
      where: { NumPersoneriaJuridica: numPersoneriaJuridica }
    });

    if (existePersoneria) {
      return res.status(409).json({
        message: "Ya existe una junta con esa personería jurídica"
      });
    }

    // ------------------------------------------
    // VALIDAR DUPLICADO DE RAZÓN SOCIAL EN MISMO MUNICIPIO
    // ------------------------------------------
    const existeRazonLugar = await Junta.findOne({
      where: {
        RazonSocial: razonSocial,
        IDMunicipio: idMunicipio
      }
    });

    if (existeRazonLugar) {
      return res.status(409).json({
        message: "Ya existe una junta con esa razón social en este municipio"
      });
    }

    // ------------------------------------------
    // VALIDACIÓN DE FECHAS LÓGICAS
    // ------------------------------------------
    if (new Date(fechaInicioPeriodo) >= new Date(fechaFinPeriodo)) {
      return res.status(400).json({
        message: "La fecha de inicio del período debe ser menor que la fecha de fin"
      });
    }

    if (new Date(fechaCreacion) > new Date()) {
      return res.status(400).json({
        message: "La fecha de creación no puede ser en el futuro"
      });
    }

    // ------------------------------------------
    // CREAR JUNTA
    // ------------------------------------------
    const nuevaJunta = await Junta.create({
      RazonSocial: razonSocial,
      Direccion: direccion,
      NumPersoneriaJuridica: numPersoneriaJuridica,
      FechaCreacion: fechaCreacion,
      FechaInicioPeriodo: fechaInicioPeriodo,
      FechaFinPeriodo: fechaFinPeriodo,
      FechaAsamblea: fechaAsamblea,
      Zona: zona,
      TipoJunta: tipoJunta,
      IDMunicipio: idMunicipio,
      IDInstitucion: idInstitucion,
      IDReconocida: "123e4567-e89b-12d3-a456-426614174000"
    });

    return res.status(201).json({
      message: "Junta creada correctamente",
      junta: nuevaJunta
    });

  } catch (error) {
    console.error("Error creando junta:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const obtenerJuntas = async (req, res) => {
  try {
    const { tipoJunta, idMunicipio } = req.query;

    // ------------------------------------------
    // VALIDAR QUE VENGAN AMBOS CAMPOS
    // ------------------------------------------
    if (!tipoJunta || !idMunicipio) {
      return res.status(400).json({
        message: "Debe enviar tipoJunta e idMunicipio para realizar la consulta"
      });
    }

    // ------------------------------------------
    // VALIDAR QUE EL TIPO DE JUNTA EXISTA
    // ------------------------------------------
    const tipo = await TipoJunta.findByPk(tipoJunta);
    if (!tipo) {
      return res.status(400).json({
        message: "El tipo de junta no existe"
      });
    }

    // ------------------------------------------
    // VALIDAR QUE EL MUNICIPIO EXISTA
    // ------------------------------------------
    const municipio = await Lugar.findByPk(idMunicipio);
    if (!municipio) {
      return res.status(400).json({
        message: "El municipio no existe"
      });
    }

    // ------------------------------------------
    // CONSULTAR JUNTAS FILTRADAS
    // ------------------------------------------
    const juntas = await Junta.findAll({
      where: {
        TipoJunta: tipoJunta,
        IDMunicipio: idMunicipio
      },
      include: [
        { model: Lugar, attributes: ["IDLugar", "NombreLugar"] },
        { model: TipoJunta, attributes: ["IDTipoJuntas", "NombreTipoJunta"] },
        { model: Institucion, attributes: ["IDInstitucion", "NombreInstitucion"] },
        { model: Reconocida, attributes: ["IDReconocida", "Nombre"] }
      ]
    });

    return res.json(juntas);

  } catch (error) {
    console.error("Error obteniendo juntas:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};
