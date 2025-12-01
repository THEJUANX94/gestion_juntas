import { Usuario } from "../model/usuarioModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Cargo } from "../model/cargoModel.js";
import { Comisiones } from "../model/comisionModel.js";
import { Junta } from "../model/juntaModel.js";
import { Periodo } from "../model/periodoModel.js";
import { PeriodoPorMandato } from "../model/periodopormandato.js";
import { TipoDocumento } from "../model/tipoDocumentoModel.js";
import { Lugar } from "../model/lugarModel.js";
import { Op } from "sequelize";

export const validarPeriodoMandato = (junta, inicio, fin) => {
  const inicioJunta = new Date(junta.FechaInicioPeriodo);
  const finJunta = new Date(junta.FechaFinPeriodo);

  if (inicio < inicioJunta || fin > finJunta) {
    return `El periodo del mandatario (${inicio.toISOString()} - ${fin.toISOString()})
            debe estar dentro del periodo de la junta
            (${junta.FechaInicioPeriodo} - ${junta.FechaFinPeriodo}).`;
  }
  return null;
};


export const validarPresidenteUnico = async (documento, cargoID, idJunta) => {
  const cargoPresidente = await Cargo.findOne({
    where: { NombreCargo: "Presidente" }
  });

  if (!cargoPresidente || cargoID !== cargoPresidente.IDCargo) return null;

  const juntaActual = await Junta.findByPk(idJunta);
  if (!juntaActual) return "La junta no existe.";

  const presidente = await MandatarioJunta.findOne({
    where: {
      NumeroIdentificacion: documento,
      IDCargo: cargoPresidente.IDCargo
    },
    include: [
      {
        model: Junta,
        where: { TipoJunta: juntaActual.TipoJunta }
      }
    ]
  });

  return presidente
    ? `El usuario ya es presidente en otra junta del mismo tipo (${juntaActual.TipoJunta}).`
    : null;
};


export const crearPeriodoYVinculo = async (documento, idJunta, inicio, fin) => {
  const periodo = await Periodo.create({
    FechaInicio: inicio,
    FechaFin: fin
  });

  await PeriodoPorMandato.create({
    IDPeriodo: periodo.IDPeriodo,
    NumeroIdentificacion: documento,
    IDJunta: idJunta
  });

  return periodo;
};


export const crearMandatario = async (req, res) => {
  try {
    const idJunta = req.params.id;

    const {
      documento,
      tipoDocumento,
      expedido,
      primernombre,
      segundonombre,
      primerapellido,
      segundoapellido,
      genero,
      fNacimiento,
      residencia,
      telefono,
      profesion,
      email,
      fInicioPeriodo,
      fFinPeriodo,
      cargo,
      comision
    } = req.body;

    const junta = await Junta.findByPk(idJunta);
    if (!junta) return res.status(404).json({ message: "La junta no existe" });

    // Validar periodo
    const errorPeriodo = validarPeriodoMandato(junta, new Date(fInicioPeriodo), new Date(fFinPeriodo));
    if (errorPeriodo) return res.status(400).json({ message: errorPeriodo });

    // Validar presidente único
    const errorCargo = await validarPresidenteUnico(documento, cargo, idJunta);
    if (errorCargo) return res.status(400).json({ message: errorCargo });

    // Crear o actualizar usuario
    let usuario = await Usuario.findByPk(documento);
    if (!usuario) {
      usuario = await Usuario.create({
        NumeroIdentificacion: documento,
        PrimerNombre: primernombre,
        SegundoNombre: segundonombre,
        PrimerApellido: primerapellido,
        SegundoApellido: segundoapellido,
        Sexo: genero,
        FechaNacimiento: fNacimiento,
        Residencia: residencia,
        Celular: telefono,
        Correo: email,
        IDRol: "8d0784a1-7fc6-406a-903f-3b9bfd43ce16",
        IDTipoDocumento: tipoDocumento
      });
    }

    // Crear mandatario
    const mandatario = await MandatarioJunta.create({
      NumeroIdentificacion: documento,
      IDJunta: idJunta,
      IDCargo: cargo || null,
      IDComision: comision || null,
      Residencia: residencia,
      Expedido: expedido,
      Profesion: profesion
    });

    // Crear periodo + vincular
    const periodo = await crearPeriodoYVinculo(documento, idJunta, fInicioPeriodo, fFinPeriodo);

    res.json({
      message: "Mandatario creado correctamente",
      mandatario,
      periodo
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear mandatario", error: error.message });
  }
};


// ======================================================
//  OBTENER MIEMBROS DE LA JUNTA
// ======================================================
export const getMiembrosJunta = async (req, res) => {
  const { id } = req.params;

  try {
    console.log("Buscando miembros para junta:", id);

    // ============================================
    // 1. Obtener información de la junta (sin Periodo)
    // ============================================
    const junta = await Junta.findOne({
      where: { IDJunta: id }
    });

    if (!junta) {
      return res.status(404).json({ message: "Junta no encontrada" });
    }

    // periodo global de la junta
    const periodoJunta = {
      inicio: junta.FechaInicioPeriodo,
      fin: junta.FechaFinPeriodo
    };

    // ============================================
    // 2. Obtener miembros
    // ============================================
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
          ],
          include: [
            {
              model: TipoDocumento,
              attributes: ["NombreTipo"]
            }
          ]
        },
        { model: Cargo, attributes: ["NombreCargo"] },
        { model: Comisiones, as: "Comision", attributes: ["Nombre"] },
        { model: Lugar, as: "LugarExpedido", attributes: ["NombreLugar"] },
        { model: Lugar, as: "LugarResidencia", attributes: ["NombreLugar"] },

        {
          model: PeriodoPorMandato,
          as: "Periodos",
          required: false,
          where: { IDJunta: id },
          include: [
            {
              model: Periodo,
              as: "Periodo",
              attributes: ["FechaInicio", "FechaFin"]
            }
          ]
        }
      ]
    });

    console.log("Miembros encontrados:", miembros.length);

    // ============================================
    // 3. Formatear respuesta
    // ============================================
    const resultado = miembros.map(m => {
      const u = m.Usuario;

      const f = new Date(u.FechaNacimiento + "T00:00:00");
      const nacimiento = `${String(f.getUTCDate()).padStart(2, "0")}/${String(f.getUTCMonth() + 1).padStart(2, "0")}/${f.getUTCFullYear()}`;

      // edad
      const hoy = new Date();
      let edad = hoy.getFullYear() - f.getUTCFullYear();
      if (hoy < new Date(hoy.getFullYear(), f.getUTCMonth(), f.getUTCDate())) edad--;

      const periodoMandato = m.Periodos?.[0]?.Periodo || null;




      return {
        cargo: m.Cargo?.NombreCargo || "",
        comision: m.Comision?.Nombre || "",
        nombreCompleto: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),
        documento: u.NumeroIdentificacion,
        tipoDocumento: u.TipoDocumento?.NombreTipo || "",
        expedido: m.LugarExpedido?.NombreLugar || "",
        residencia: m.LugarResidencia?.NombreLugar || "",
        genero: u.Sexo,
        edad,
        nacimiento,
        profesion: m.Profesion || "",



        periodoJunta: `${new Date(periodoJunta.inicio).getFullYear()} - ${new Date(periodoJunta.fin).getFullYear()}`,


        inicioMandato: periodoMandato?.FechaInicio || null,
        finMandato: periodoMandato?.FechaFin || null,


        telefono: u.Celular,
        email: u.Correo
      };
    });

    res.json(resultado);

  } catch (error) {
    console.error("Error cargando miembros:", error);
    res.status(500).json({
      message: "Error cargando miembros",
      error: error.message
    });
  }
};




export const buscarMandatarios = async (req, res) => {
  const { query } = req.query;

  try {
    const resultados = await Usuario.findAll({
      where: {
        [Op.or]: [
          { NumeroIdentificacion: { [Op.like]: `%${query}%` } },
          { PrimerNombre: { [Op.iLike]: `%${query}%` } },
          { SegundoNombre: { [Op.iLike]: `%${query}%` } },
          { PrimerApellido: { [Op.iLike]: `%${query}%` } },
          { SegundoApellido: { [Op.iLike]: `%${query}%` } },
          { Correo: { [Op.iLike]: `%${query}%` } },
          { Celular: { [Op.iLike]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: MandatarioJunta,
          required: false,
          include: [
            {
              model: Cargo,
              required: false,
              where: {
                NombreCargo: { [Op.like]: `%${query}%` }
              }
            }
          ]
        }
      ]
    });

    res.json(resultados);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error buscando mandatarios", error: error.message });
  }
};

export const validarMandatarioEnJunta = async (req, res) => {
  try {
    const { idJunta, idUsuario } = req.params;

    const existe = await MandatarioJunta.findOne({
      where: { NumeroIdentificacion: idUsuario, IDJunta: idJunta }
    });

    res.json({ existe: !!existe });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error validando mandatario" });
  }
};


export const agregarMandatarioExistente = async (req, res) => {
  try {
    const { idJunta } = req.params;

    const {
      IDUsuario,
      Residencia,
      Profesion,
      IDCargo,
      IDComision,
      fInicioPeriodo,
      fFinPeriodo
    } = req.body;

    // ==============================
    // VALIDACIONES BÁSICAS
    // ==============================
    if (!IDUsuario) return res.status(400).json({ message: "Falta el IDUsuario" });
    if (!Residencia) return res.status(400).json({ message: "Falta la Residencia" });
    if (!Profesion) return res.status(400).json({ message: "Falta la profesión" });
    if (!fInicioPeriodo || !fFinPeriodo) {
      return res.status(400).json({
        message: "Debe ingresar Inicio y Fin del periodo."
      });
    }

    // usuario y junta
    const usuario = await Usuario.findByPk(IDUsuario);
    if (!usuario) return res.status(404).json({ message: "El usuario no existe" });

    const junta = await Junta.findByPk(idJunta);
    if (!junta) return res.status(404).json({ message: "La junta no existe" });

    const inicioMandato = new Date(fInicioPeriodo);
    const finMandato = new Date(fFinPeriodo);

    // Validar periodo usando función global
    const errorPeriodo = validarPeriodoMandato(junta, inicioMandato, finMandato);
    if (errorPeriodo) return res.status(400).json({ message: errorPeriodo });

    // Validar si ya pertenece
    const existe = await MandatarioJunta.findOne({
      where: { NumeroIdentificacion: IDUsuario, IDJunta: idJunta }
    });

    if (existe) {
      return res.status(400).json({ message: "El usuario ya pertenece a esta junta" });
    }

    // Validar presidente único usando tu función
    const errorCargo = await validarPresidenteUnico(IDUsuario, IDCargo, idJunta);
    if (errorCargo) return res.status(400).json({ message: errorCargo });

    // Obtener último EXPEDIDO registrado
    const ultimoMandato = await MandatarioJunta.findOne({
      where: { NumeroIdentificacion: IDUsuario },
      order: [['IDJunta', 'DESC']]
    });

    // ==============================
    // Crear Mandatario
    // ==============================
    const mandatario = await MandatarioJunta.create({
      NumeroIdentificacion: IDUsuario,
      IDJunta: idJunta,
      Residencia,
      Profesion,
      Expedido: ultimoMandato?.Expedido || null,
      IDCargo: IDCargo || null,
      IDComision: IDComision || null
    });

    // Crear periodo vinculado
    const nuevoPeriodo = await crearPeriodoYVinculo(
      IDUsuario,
      idJunta,
      fInicioPeriodo,
      fFinPeriodo
    );

    res.json({
      message: "Mandatario agregado correctamente",
      mandatario,
      periodo: nuevoPeriodo
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al agregar el mandatario",
      error: error.message
    });
  }
};
