import { Junta } from "../model/juntaModel.js";
import { Lugar } from "../model/lugarModel.js";
import { Institucion } from "../model/institucionModel.js";
import { TipoJunta } from "../model/tipoJuntaModel.js";
import { Reconocida } from "../model/reconocidaModel.js";
import { PeriodoPorMandato } from "../model/periodopormandato.js";
import { Periodo } from "../model/periodoModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Op } from "sequelize";
import ExcelJS from "exceljs";

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

        if (new Date(fechaAsamblea) > new Date()) {
      return res.status(400).json({
        message: "La fecha de la asamblea no puede ser en el futuro"
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

// ======================================================
//  OBTENER TODAS LAS JUNTAS (SIN FILTROS)
// ======================================================
export const obtenerTodasLasJuntas = async (req, res) => {
  try {
    const juntas = await Junta.findAll({
      include: [
        { 
          model: Lugar, 
          attributes: ["IDLugar", "NombreLugar"] 
        },
        { 
          model: TipoJunta, 
          attributes: ["IDTipoJuntas", "NombreTipoJunta"] 
        },
        { 
          model: Institucion, 
          attributes: ["IDInstitucion", "NombreInstitucion"] 
        },
        { 
          model: Reconocida, 
          attributes: ["IDReconocida", "Nombre"] 
        }
      ],
      order: [["RazonSocial", "ASC"]]
    });

    return res.json(juntas);

  } catch (error) {
    console.error("Error obteniendo todas las juntas:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
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
            "Correo"
          ]
        },
        {
          model: Cargo, // Si tienes tabla de cargos
          attributes: ["NombreCargo"]
        }
      ]
    });

    res.json(miembros);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================================================
//  OBTENER UNA JUNTA ESPECÍFICA POR ID
// ======================================================
export const obtenerJuntaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const junta = await Junta.findByPk(id, {
      include: [
        { 
          model: Lugar, 
          attributes: ["IDLugar", "NombreLugar"] 
        },
        { 
          model: TipoJunta, 
          attributes: ["IDTipoJuntas", "NombreTipoJunta"] 
        },
        { 
          model: Institucion, 
          attributes: ["IDInstitucion", "NombreInstitucion"] 
        },
        { 
          model: Reconocida, 
          attributes: ["IDReconocida", "Nombre"] 
        }
      ]
    });

    if (!junta) {
      return res.status(404).json({
        message: "La junta no existe"
      });
    }

    // Obtener número de afiliados (mandatarios activos)
    const numeroAfiliados = await MandatarioJunta.count({
      where: { IDJunta: id }
    });

    // Construir respuesta
    const response = {
      IDJunta: junta.IDJunta,
      RazonSocial: junta.RazonSocial,
      Direccion: junta.Direccion,
      NumeroPersoneriaJuridica: junta.NumPersoneriaJuridica,
      FechaCreacion: junta.FechaCreacion,
      FechaInicioPeriodo: junta.FechaInicioPeriodo,
      FechaFinPeriodo: junta.FechaFinPeriodo,
      FechaAsamblea: junta.FechaAsamblea,
      Zona: junta.Zona,
      IDTipoJunta: junta.TipoJunta,
      IDMunicipio: junta.IDMunicipio,
      IDInstitucion: junta.IDInstitucion,
      IDReconocida: junta.IDReconocida,
      NumeroAfiliados: numeroAfiliados,
      
      // Datos relacionados
      Municipio: junta.Lugar,
      TipoJunta: junta.TipoJuntum,
      Institucion: junta.Institucion,
      Reconocida: junta.Reconocida
    };

    return res.json(response);

  } catch (error) {
    console.error("Error obteniendo junta:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

// ======================================================
//  ACTUALIZAR UNA JUNTA
// ======================================================
export const actualizarJunta = async (req, res) => {
  try {
    const { id } = req.params;

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
      zona
    } = req.body;

    // ------------------------------------------
    // VALIDAR QUE LA JUNTA EXISTA
    // ------------------------------------------
    const junta = await Junta.findByPk(id);
    if (!junta) {
      return res.status(404).json({
        message: "La junta no existe"
      });
    }

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
    // VALIDAR EXISTENCIA DEL MUNICIPIO
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
    // VALIDAR DUPLICADO DE RAZÓN SOCIAL (excluyendo la junta actual)
    // ------------------------------------------
    const existeRazonLugar = await Junta.findOne({
      where: {
        RazonSocial: razonSocial,
        IDMunicipio: idMunicipio,
        IDJunta: { [Op.ne]: id } // Excluir la junta actual
      }
    });

    if (existeRazonLugar) {
      return res.status(409).json({
        message: "Ya existe otra junta con esa razón social en este municipio"
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

    if (new Date(fechaAsamblea) > new Date()) {
      return res.status(400).json({
        message: "La fecha de la asamblea no puede ser en el futuro"
      });
    }

    // ------------------------------------------
    // VALIDAR QUE LOS PERIODOS DE MANDATARIOS ESTÉN DENTRO DEL NUEVO PERIODO
    // ------------------------------------------
    const mandatariosConPeriodo = await MandatarioJunta.findAll({
      where: { IDJunta: id },
      include: [
        {
          model: PeriodoPorMandato,
          as: "Periodos",
          include: [
            {
              model: Periodo,
              as: "Periodo"
            }
          ]
        }
      ]
    });

    for (const mandatario of mandatariosConPeriodo) {
      for (const periodoPorMandato of mandatario.Periodos || []) {
        const periodo = periodoPorMandato.Periodo;
        
        if (periodo) {
          const inicioPeriodo = new Date(periodo.FechaInicio);
          const finPeriodo = new Date(periodo.FechaFin);
          const nuevoInicio = new Date(fechaInicioPeriodo);
          const nuevoFin = new Date(fechaFinPeriodo);

          if (inicioPeriodo < nuevoInicio || finPeriodo > nuevoFin) {
            return res.status(400).json({
              message: `El periodo del mandatario con documento ${mandatario.NumeroIdentificacion} (${periodo.FechaInicio} - ${periodo.FechaFin}) está fuera del nuevo periodo de la junta`
            });
          }
        }
      }
    }

    // ------------------------------------------
    // ACTUALIZAR JUNTA
    // ------------------------------------------
    await junta.update({
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
      IDInstitucion: idInstitucion
    });

    return res.json({
      message: "Junta actualizada correctamente",
      junta: junta
    });

  } catch (error) {
    console.error("Error actualizando junta:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};



export const eliminarJunta = async (req, res) => {
  try {
    const { id } = req.params;

    // ------------------------------------------
    // VALIDAR QUE LA JUNTA EXISTA
    // ------------------------------------------
    const junta = await Junta.findByPk(id);
    if (!junta) {
      return res.status(404).json({
        message: "La junta no existe"
      });
    }

    // ------------------------------------------
    // OBTENER TODOS LOS MANDATARIOS DE ESA JUNTA
    // ------------------------------------------
    const mandatarios = await MandatarioJunta.findAll({
      where: { IDJunta: id }
    });

    // ------------------------------------------
    // ELIMINAR PERIODOS DE TODOS LOS MANDATARIOS
    // ------------------------------------------
    for (const m of mandatarios) {
      const periodosPorMandato = await PeriodoPorMandato.findAll({
        where: {
          IDJunta: id,
          NumeroIdentificacion: m.NumeroIdentificacion
        }
      });

      for (const pm of periodosPorMandato) {
        // 1. eliminar relación
        await PeriodoPorMandato.destroy({ where: { IDPeriodo: pm.IDPeriodo } });

        // 2. eliminar periodo
        await Periodo.destroy({ where: { IDPeriodo: pm.IDPeriodo } });
      }
    }

    // ------------------------------------------
    // ELIMINAR MANDATARIOS ASOCIADOS A LA JUNTA
    // ------------------------------------------
    await MandatarioJunta.destroy({
      where: { IDJunta: id }
    });

    // ------------------------------------------
    // ELIMINAR LA JUNTA
    // ------------------------------------------
    await Junta.destroy({
      where: { IDJunta: id }
    });

    return res.json({
      message: "Junta eliminada correctamente junto con todos sus mandatarios y periodos"
    });

  } catch (error) {
    console.error("Error eliminando junta:", error);
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message
    });
  }
};

export const exportarJuntasExcel = async (req, res) => {
  try {
    const juntas = await Junta.findAll({
      include: [
        { model: Lugar },
        { model: TipoJunta },
        { model: Institucion },
        { model: Reconocida }
      ],
      order: [["RazonSocial", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Juntas");

    sheet.columns = [
      { header: "Razón Social", key: "razon", width: 30 },
      { header: "Dirección", key: "direccion", width: 30 },
      { header: "Personería Jurídica", key: "personeria", width: 25 },
      { header: "Municipio", key: "municipio", width: 20 },
      { header: "Tipo Junta", key: "tipo", width: 20 },
      { header: "Institución", key: "institucion", width: 25 },
      { header: "Zona", key: "zona", width: 15 },
      { header: "Fecha Creación", key: "creacion", width: 15 },
      { header: "Inicio Periodo", key: "inicio", width: 15 },
      { header: "Fin Periodo", key: "fin", width: 15 },
      { header: "Fecha Asamblea", key: "asamblea", width: 15 },
      { header: "Reconocida", key: "reconocida", width: 15 },
    ];

    juntas.forEach((j) => {
      sheet.addRow({
        razon: j.RazonSocial,
        direccion: j.Direccion,
        personeria: j.NumPersoneriaJuridica,
        municipio: j.Lugar?.NombreLugar || "",
        tipo: j.TipoJuntum?.NombreTipoJunta || "",
        institucion: j.Institucion?.NombreInstitucion || "",
        zona: j.Zona,
        creacion: j.FechaCreacion,
        inicio: j.FechaInicioPeriodo,
        fin: j.FechaFinPeriodo,
        asamblea: j.FechaAsamblea,
        reconocida: j.Reconocida?.Nombre || "",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Listado_Juntas.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generando Excel" });
  }
};


