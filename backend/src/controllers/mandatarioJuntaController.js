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
import { PoblacionesPorPersona } from "../model/poblacionesporpersonaModel.js";
import { Credenciales } from "../model/CredencialesModel.js";
import { Firma } from "../model/firmaModel.js";
import { sequelize } from "../config/database.js";

const soloFechaUTC = (d) => {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
};

export const validarPeriodoMandato = (junta, inicio, fin) => {
  const inicioJunta = soloFechaUTC(junta.FechaInicioPeriodo);
  const finJunta    = soloFechaUTC(junta.FechaFinPeriodo);
  const inicioNorm  = soloFechaUTC(inicio);
  const finNorm     = soloFechaUTC(fin);

  if (inicioNorm < inicioJunta || finNorm > finJunta) {
    return `El periodo del mandatario (${inicioNorm.toISOString().split('T')[0]} - ${finNorm.toISOString().split('T')[0]})
            debe estar dentro del periodo de la junta
            (${inicioJunta.toISOString().split('T')[0]} - ${finJunta.toISOString().split('T')[0]}).`;
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
      IDCargo: cargoPresidente.IDCargo,
      IDJunta: { [Op.ne]: idJunta } // ✅ Excluir la junta actual
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


export const crearPeriodoYVinculo = async (documento, idJunta, inicio, fin, t, idMandatarioJunta = null) => {
  const periodo = await Periodo.create({
    FechaInicio: inicio,
    FechaFin: fin
  }, { transaction: t });

  await PeriodoPorMandato.create({
    IDPeriodo: periodo.IDPeriodo,
    NumeroIdentificacion: documento,
    IDJunta: idJunta,
    IDMandatarioJunta: idMandatarioJunta
  }, { transaction: t });

  return periodo;
};


export const validarCargoUnico = async (cargoID, idJunta) => {
  if (!cargoID) return null;

  const CARGOS_UNICOS = ["Presidente", "Vicepresidente", "Tesorero", "Fiscal", "Secretario (a)"];

  const cargo = await Cargo.findByPk(cargoID);
  if (!cargo || !CARGOS_UNICOS.includes(cargo.NombreCargo)) return null;

  const existe = await MandatarioJunta.findOne({
    where: { IDJunta: idJunta, IDCargo: cargoID }
  });

  return existe
    ? `Ya existe un ${cargo.NombreCargo} en esta junta.`
    : null;
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
      comision,
      gruposPoblacionales
    } = req.body;

    const junta = await Junta.findByPk(idJunta);
    if (!junta) return res.status(404).json({ message: "La junta no existe" });

    // Validar periodo
    const errorPeriodo = validarPeriodoMandato(junta, new Date(fInicioPeriodo), new Date(fFinPeriodo));
    if (errorPeriodo) return res.status(400).json({ message: errorPeriodo });

    // Validar cargo único en la junta
    const errorCargoUnico = await validarCargoUnico(cargo, idJunta);
    if (errorCargoUnico) return res.status(400).json({ message: errorCargoUnico });

    // Validar presidente único
    const errorCargo = await validarPresidenteUnico(documento, cargo, idJunta);
    if (errorCargo) return res.status(400).json({ message: errorCargo });

    // Validar duplicado exacto: misma persona + mismo cargo en la misma junta
    const existeDuplicado = await MandatarioJunta.findOne({
      where: { NumeroIdentificacion: documento, IDJunta: idJunta, IDCargo: cargo || null }
    });
    if (existeDuplicado) {
      return res.status(400).json({ message: "Esta persona ya tiene ese cargo en la junta" });
    }

    // A partir de aquí empiezan las escrituras: transacción gestionada
    // (commit/rollback automáticos según el callback resuelva o lance)
    const { mandatario, periodo } = await sequelize.transaction(async (t) => {
      // Crear o actualizar usuario
      let usuario = await Usuario.findByPk(documento, { transaction: t });
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
        }, { transaction: t });
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
      }, { transaction: t });

      //Lógica para guardar Grupos Poblacionales

      if (gruposPoblacionales && Array.isArray(gruposPoblacionales) && gruposPoblacionales.length > 0) {
        // 1. Opcional: Limpiar asociaciones previas si el usuario ya existía
        // (Útil si estás actualizando un usuario que ya tenía grupos)
        await PoblacionesPorPersona.destroy({
          where: { numeroidentificacion: documento },
          transaction: t,
        });

        // 2. Crear las nuevas asociaciones
        const nuevasAsociaciones = gruposPoblacionales.map(idGrupo => ({
          numeroidentificacion: documento,
          idgrupopoblacional: idGrupo
        }));

        await PoblacionesPorPersona.bulkCreate(nuevasAsociaciones, { transaction: t });
      }

      const periodo = await crearPeriodoYVinculo(documento, idJunta, fInicioPeriodo, fFinPeriodo, t, mandatario.IDMandatarioJunta);

      await junta.update({ UltimoEditor: req.usuario.nombre }, { transaction: t });

      return { mandatario, periodo };
    });

    res.json({
      message: "Mandatario creado correctamente y grupos asociados",
      mandatario,
      periodo,
      grupos: gruposPoblacionales
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear mandatario", error: error.message });
  }
};

export const verificarDocumento = async (req, res) => {
  try {
    const { documento } = req.params;

    const usuario = await Usuario.findByPk(documento);

    if (usuario) {
      return res.json({ existe: true, message: "El documento ya existe en el sistema" });
    }

    return res.json({ existe: false });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error verificando documento",
      error: error.message
    });
  }
};



// ======================================================
//  OBTENER MIEMBROS DE LA JUNTA
// ======================================================
export const getMiembrosJunta = async (req, res) => {
  const { id } = req.params;

  try {
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

        {
          model: PeriodoPorMandato,
          as: "Periodos",
          required: false,
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
        idMandatario: m.IDMandatarioJunta,
        cargo: m.Cargo?.NombreCargo || "",
        comision: m.Comision?.Nombre || "",
        nombreCompleto: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),
        documento: u.NumeroIdentificacion,
        tipoDocumento: u.TipoDocumento?.NombreTipo || "",
        expedido: m.LugarExpedido?.NombreLugar || "",
        residencia: m.Residencia || "",
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
    if (!fInicioPeriodo || !fFinPeriodo) {
      return res.status(400).json({ message: "Debe ingresar Inicio y Fin del periodo." });
    }

    // usuario y junta
    const usuario = await Usuario.findByPk(IDUsuario);
    if (!usuario) return res.status(404).json({ message: "El usuario no existe" });

    const junta = await Junta.findByPk(idJunta);
    if (!junta) return res.status(404).json({ message: "La junta no existe" });

    const inicioMandato = new Date(fInicioPeriodo);
    const finMandato = new Date(fFinPeriodo);

    const errorPeriodo = validarPeriodoMandato(junta, inicioMandato, finMandato);
    if (errorPeriodo) return res.status(400).json({ message: errorPeriodo });

    const errorCargoUnico = await validarCargoUnico(IDCargo, idJunta);
    if (errorCargoUnico) return res.status(400).json({ message: errorCargoUnico });

    const errorCargo = await validarPresidenteUnico(IDUsuario, IDCargo, idJunta);
    if (errorCargo) return res.status(400).json({ message: errorCargo });

    if (!Profesion) {
      return res.status(400).json({ message: "Falta la Profesión" });
    }

    const ultimoMandato = await MandatarioJunta.findOne({
      where: { NumeroIdentificacion: IDUsuario },
      order: [['IDMandatarioJunta', 'DESC']]
    });

    // ==============================
    // Escrituras: transacción gestionada
    // ==============================
    const { mandatario, nuevoPeriodo } = await sequelize.transaction(async (t) => {
      const mandatario = await MandatarioJunta.create({
        NumeroIdentificacion: IDUsuario,
        IDJunta: idJunta,
        Residencia,
        Profesion,
        Expedido: ultimoMandato?.Expedido || null,
        IDCargo: IDCargo || null,
        IDComision: IDComision || null
      }, { transaction: t });

      const nuevoPeriodo = await crearPeriodoYVinculo(
        IDUsuario,
        idJunta,
        fInicioPeriodo,
        fFinPeriodo,
        t,
        mandatario.IDMandatarioJunta
      );

      return { mandatario, nuevoPeriodo };
    });

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

// ======================================================
//  OBTENER DATOS DE UN MANDATARIO ESPECÍFICO
// ======================================================
export const obtenerMandatario = async (req, res) => {
  try {
    const { idMandatario } = req.params;

    // 1. Buscar el mandatario por su PK
    const mandatario = await MandatarioJunta.findByPk(idMandatario, {
      include: [
        {
          model: Usuario,
          attributes: [
            'NumeroIdentificacion',
            'IDTipoDocumento',
            'PrimerNombre',
            'SegundoNombre',
            'PrimerApellido',
            'SegundoApellido',
            'Sexo',
            'FechaNacimiento',
            'Celular',
            'Correo'
          ]
        },
        {
          model: Cargo,
          attributes: ['IDCargo', 'NombreCargo']
        },
        {
          model: Comisiones,
          as: "Comision",
          attributes: ['IDComision', 'Nombre']
        }
      ]
    });

    if (!mandatario) {
      return res.status(404).json({
        message: "Mandatario no encontrado en esta junta"
      });
    }

    // 2. Buscar el periodo del mandato
    const periodoMandato = await PeriodoPorMandato.findOne({
      where: { IDMandatarioJunta: idMandatario },
      include: [{
        model: Periodo,
        as: "Periodo",
        attributes: ['FechaInicio', 'FechaFin']
      }]
    });

    // 3. Construir respuesta
    const response = {
      documento: mandatario.Usuario.NumeroIdentificacion,
      tipoDocumento: mandatario.Usuario.IDTipoDocumento,
      expedido: mandatario.Expedido,
      primernombre: mandatario.Usuario.PrimerNombre,
      segundonombre: mandatario.Usuario.SegundoNombre || "",
      primerapellido: mandatario.Usuario.PrimerApellido,
      segundoapellido: mandatario.Usuario.SegundoApellido || "",
      genero: mandatario.Usuario.Sexo,
      fNacimiento: mandatario.Usuario.FechaNacimiento,
      residencia: mandatario.Residencia,
      telefono: mandatario.Usuario.Celular,
      profesion: mandatario.Profesion,
      email: mandatario.Usuario.Correo,
      fInicioPeriodo: periodoMandato?.Periodo?.FechaInicio || null,
      fFinPeriodo: periodoMandato?.Periodo?.FechaFin || null,
      cargo: mandatario.IDCargo || "",
      comision: mandatario.IDComision || ""
    };

    return res.json(response);

  } catch (error) {
    console.error("Error obteniendo mandatario:", error);
    return res.status(500).json({
      message: "Error al obtener datos del mandatario",
      error: error.message
    });
  }
};


export const actualizarMandatario = async (req, res) => {
  try {
    const { idMandatario } = req.params;

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

    if (!primernombre || !primerapellido) {
      return res.status(400).json({ message: "Primer nombre y primer apellido son obligatorios" });
    }

    if (email && !email.includes("@")) {
      return res.status(400).json({ message: "Email inválido" });
    }

    if (!fInicioPeriodo || !fFinPeriodo) {
      return res.status(400).json({ message: "Debe ingresar fecha de inicio y fin del periodo" });
    }

    const mandatario = await MandatarioJunta.findByPk(idMandatario);
    if (!mandatario) {
      return res.status(404).json({ message: "El mandatario no existe en esta junta" });
    }

    const { IDJunta: idJunta, NumeroIdentificacion: documentoActual } = mandatario;

    // Cédula que llega del formulario; si no viene, se conserva la actual
    const documentoNuevo = (documento ?? documentoActual).toString().trim();
    const cambiaCedula = documentoNuevo !== documentoActual;

    if (cambiaCedula) {
      // La cédula es la llave primaria del usuario: validamos formato
      if (!/^\d{6,10}$/.test(documentoNuevo)) {
        return res.status(400).json({ message: "La cédula debe tener entre 6 y 10 números" });
      }
      // No se puede corregir hacia una cédula que ya pertenece a otra persona
      const ocupada = await Usuario.findByPk(documentoNuevo);
      if (ocupada) {
        return res.status(400).json({
          message: `Ya existe un usuario registrado con la cédula ${documentoNuevo}. No es posible reasignarla.`
        });
      }
    }

    const junta = await Junta.findByPk(idJunta);
    if (!junta) return res.status(404).json({ message: "La junta no existe" });

    const errorPeriodo = validarPeriodoMandato(junta, new Date(fInicioPeriodo), new Date(fFinPeriodo));
    if (errorPeriodo) return res.status(400).json({ message: errorPeriodo });

    const errorCargo = await validarPresidenteUnico(documentoNuevo, cargo, idJunta);
    if (errorCargo) return res.status(400).json({ message: errorCargo });

    const usuario = await Usuario.findByPk(documentoActual);
    if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

    // Escrituras: transacción gestionada (commit/rollback automáticos)
    await sequelize.transaction(async (t) => {
      if (cambiaCedula) {
        // Cambiar la cédula = mover la PK del usuario y repuntar todas las
        // tablas que la referencian. Se crea el usuario nuevo, se repuntan
        // los hijos y se borra el viejo. El Correo (con restricción UNIQUE)
        // se asigna al final para no chocar con el registro que aún existe.
        await Usuario.create({
          NumeroIdentificacion: documentoNuevo,
          PrimerNombre: primernombre,
          SegundoNombre: segundonombre || null,
          PrimerApellido: primerapellido,
          SegundoApellido: segundoapellido || null,
          Sexo: genero,
          FechaNacimiento: fNacimiento,
          Celular: telefono,
          Correo: null,
          IDTipoDocumento: tipoDocumento,
          IDRol: usuario.IDRol,
          TipoSangre: usuario.TipoSangre,
          Activo: usuario.Activo
        }, { transaction: t });

        // Repuntar las 5 tablas que referencian numeroidentificacion
        const where = { where: { NumeroIdentificacion: documentoActual }, transaction: t };
        await MandatarioJunta.update({ NumeroIdentificacion: documentoNuevo }, where);
        await PeriodoPorMandato.update({ NumeroIdentificacion: documentoNuevo }, where);
        await PoblacionesPorPersona.update({ NumeroIdentificacion: documentoNuevo }, where);
        await Firma.update({ NumeroIdentificacion: documentoNuevo }, where);
        await Credenciales.update(
          { numeroIdentificacion: documentoNuevo },
          { where: { numeroIdentificacion: documentoActual }, transaction: t }
        );

        // Borrar el usuario viejo (ya nadie lo referencia) y asignar el correo
        await Usuario.destroy({ where: { NumeroIdentificacion: documentoActual }, transaction: t });
        await Usuario.update(
          { Correo: email },
          { where: { NumeroIdentificacion: documentoNuevo }, transaction: t }
        );
      } else {
        await usuario.update({
          IDTipoDocumento: tipoDocumento,
          PrimerNombre: primernombre,
          SegundoNombre: segundonombre || null,
          PrimerApellido: primerapellido,
          SegundoApellido: segundoapellido || null,
          Sexo: genero,
          FechaNacimiento: fNacimiento,
          Celular: telefono,
          Correo: email
        }, { transaction: t });
      }

      await mandatario.update({
        IDCargo: cargo || null,
        IDComision: comision || null,
        Residencia: residencia,
        Expedido: expedido,
        Profesion: profesion
      }, { transaction: t });

      const periodoMandato = await PeriodoPorMandato.findOne({
        where: { IDMandatarioJunta: idMandatario },
        transaction: t
      });

      if (periodoMandato) {
        const periodo = await Periodo.findByPk(periodoMandato.IDPeriodo, { transaction: t });
        if (periodo) {
          await periodo.update({ FechaInicio: fInicioPeriodo, FechaFin: fFinPeriodo }, { transaction: t });
        }
      } else {
        await crearPeriodoYVinculo(documentoNuevo, idJunta, fInicioPeriodo, fFinPeriodo, t, idMandatario);
      }

      await junta.update({ UltimoEditor: req.usuario.nombre }, { transaction: t });
    });

    return res.json({ message: "Mandatario actualizado correctamente" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al actualizar mandatario",
      error: error.message
    });
  }
};


// ======================================================
//  ELIMINAR MANDATARIO DE UNA JUNTA
// ======================================================
export const eliminarMandatario = async (req, res) => {
  try {
    const { idMandatario } = req.params;

    // 1. Verificar que exista el mandatario
    const mandatario = await MandatarioJunta.findByPk(idMandatario);

    if (!mandatario) {
      return res.status(404).json({
        message: "El mandatario no existe o no pertenece a ninguna junta"
      });
    }

    const idJunta = mandatario.IDJunta;

    // 2. Buscar periodos vinculados a este mandato específico
    const periodosMandato = await PeriodoPorMandato.findAll({
      where: { IDMandatarioJunta: idMandatario }
    });

    // 3. Eliminar relaciones periodo-junta-mandato
    for (const p of periodosMandato) {
      await PeriodoPorMandato.destroy({
        where: { IDPeriodo: p.IDPeriodo }
      });

      await Periodo.destroy({
        where: { IDPeriodo: p.IDPeriodo }
      });
    }

    // 4. Eliminar el mandatario de la junta
    await MandatarioJunta.destroy({
      where: { IDMandatarioJunta: idMandatario }
    });

    const juntaToUpdate = await Junta.findByPk(idJunta);
    if (juntaToUpdate) await juntaToUpdate.update({ UltimoEditor: req.usuario.nombre });

    return res.json({
      message: "Mandatario eliminado correctamente de la junta"
    });

  } catch (error) {
    console.error("Error eliminando mandatario:", error);
    return res.status(500).json({
      message: "Error eliminando mandatario",
      error: error.message
    });
  }
};



// ======================================================
//  OBTENER PROFESIÓN DE UN USUARIO (desde mandatos previos)
// ======================================================
export const getProfesionUsuario = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const registro = await MandatarioJunta.findOne({
      where: {
        NumeroIdentificacion: idUsuario,
        Profesion: { [Op.ne]: null }
      },
      order: [['IDMandatarioJunta', 'DESC']],
      attributes: ['Profesion']
    });
    res.json({ Profesion: registro?.Profesion || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error obteniendo profesión" });
  }
};
