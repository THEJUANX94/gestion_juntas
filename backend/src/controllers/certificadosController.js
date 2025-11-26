import { Certificados } from "../model/CertificadoModel.js";
import { generatePdf } from "../libs/pdfFactory.js";
import { logOperation } from "../utils/logger.js";
import { Usuario } from "../model/usuarioModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Junta } from "../model/juntaModel.js";
import { Lugar } from "../model/lugarModel.js";
import { Cargo } from "../model/cargoModel.js";
import { TipoJunta } from "../model/tipoJuntaModel.js";
import { Op } from "sequelize";

export const crearCertificado = async (req, res) => {
  let Cedula = null;
  try {
    const { IDJunta } = req.body;

    if (!IDJunta) {
      return res.status(400).json({
        error: 'Faltan parámetros: IDJunta es requerido'
      });
    }

    // --- Buscar la junta por IDJunta ---
    const junta = await Junta.findByPk(IDJunta);
    if (!junta) {
      logOperation('Intento de Creación de Certificado Fallido', { motivo: 'Junta no encontrada', IDJunta }, 'error');
      return res.status(404).json({ error: 'No se encontró la junta proporcionada.' });
    }

    // Obtener municipio (Lugar) si existe
    let nombreMunicipio = null;
    try {
      const lugar = await Lugar.findByPk(junta.IDMunicipio);
      if (lugar && lugar.NombreLugar) nombreMunicipio = lugar.NombreLugar;
    } catch (e) {
      // no bloquear: dejamos nombreMunicipio en null
      console.warn('No se pudo obtener el municipio:', e.message);
    }

    // Obtener dignatarios de la junta
    const mandatariosJunta = await MandatarioJunta.findAll({ where: { IDJunta: IDJunta } });
    const dignatarios = [];
    for (const m of mandatariosJunta) {
      try {
        const u = await Usuario.findOne({ where: { NumeroIdentificacion: m.NumeroIdentificacion } });
        const c = await Cargo.findByPk(m.IDCargo);
        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;
        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          nombre: nombre || null,
          cedula: m.NumeroIdentificacion
        });
      } catch (e) {
        // ignorar un dignatario si hay problema con datos individuales
        console.warn('Error al obtener dignatario:', e.message);
      }
    }

    // --- Resolver el nombre del tipo de junta para guardarlo en TipoCertificado ---
    let tipoNombre = null;
    try {
      if (junta.TipoJunta) {
        const tipo = await TipoJunta.findByPk(junta.TipoJunta);
        if (tipo && tipo.NombreTipoJunta) {
          tipoNombre = tipo.NombreTipoJunta;
        } else {
          console.warn('TipoJunta no encontrado para id:', junta.TipoJunta);
        }
      }
    } catch (e) {
      console.warn('Error al resolver TipoJunta:', e.message);
    }

    // Si no se encuentra el nombre del tipo, usamos un valor por defecto seguro para no violar constraints
    // Preferimos registrar el warning y usar 'DESCONOCIDO' a insertar datos de relleno que confundan
    const tipoCertificadoValue = tipoNombre || 'DESCONOCIDO';

    // --- Crear el certificado en BD (necesita campos obligatorios del modelo) ---
    const nuevoCertificado = await Certificados.create({
      FechaCreacion: new Date(),
      IDJunta: junta.IDJunta,
      NombreCertificado: junta.RazonSocial || `Certificado_${new Date().toISOString()}`,
      TipoCertificado: tipoCertificadoValue
    });

    // Preparar datos para el PDF (solo con valores reales; si falta algo, se deja undefined/null)
    const datosCertificado = {
      FechaCreacion: nuevoCertificado.FechaCreacion,
      IDCertificado: nuevoCertificado.IDCertificado,
      NombreMunicipio: nombreMunicipio || null,
      nombreOrganizacion: junta.RazonSocial || null,
      personeriaNumero: junta.NumPersoneriaJuridica || null,
      personeriaFecha: junta.FechaAsamblea || null,
      periodoInicio: junta.FechaInicioPeriodo || null,
      periodoFin: junta.FechaFinPeriodo || null,
      dignatarios: dignatarios.length > 0 ? dignatarios : null,
      TipoCertificado: tipoNombre || null
    };

    // Tipo de PDF: puede venir en el body; por defecto 'autoresolutorio'
    const { tipo } = req.body;

    // Generar el PDF con la fábrica de generadores. Los generadores deben manejar valores faltantes.
    const pdfBuffer = await generatePdf(tipo || 'autoresolutorio', datosCertificado);

    logOperation(
      "Certificado Creado y Generado",
      { IDJunta: IDJunta, IDCertificado: nuevoCertificado.IDCertificado },
      'info'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado_${nuevoCertificado.IDCertificado || 'documento'}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("Error al generar certificado:", err);
    logOperation(
      'Error Inesperado al Crear Certificado',
      { error: err.message },
      'error'
    );
    res.status(500).json({ error: "Error al generar el certificado.", detalle: err.message });
  }
};

export const validarCertificado = async (req, res) => {
  try {
    const { IDCertificado } = req.params;
    const certificado = await Certificados.findByPk(IDCertificado);

    if (certificado) {
      logOperation(
        'Validación de Certificado Exitosa',
        { IDCertificado, fechaCreacion: certificado.FechaCreacion, TipoCertificado: certificado.TipoJunta },
        'info'
      );
      res.status(200).json({ valido: true, data: certificado });
    } else {
      logOperation(
        'Validación de Certificado Fallida',

        { motivo: 'Certificado no encontrado o inválido', IDCertificado },
        'info' // 'info' ya que no es un error de sistema, sino un resultado esperado
      );
      res.status(404).json({ valido: false, mensaje: 'Certificado no encontrado o inválido.' });
    }
  } catch (error) {
    console.error("Error al validar certificado:", error);
    res.status(500).json({ valido: false, mensaje: 'Error en el servidor.' });
  }
};