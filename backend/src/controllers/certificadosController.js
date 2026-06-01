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
import { Comisiones } from "../model/comisionModel.js";
import { sendMail } from "../utils/mailer.js";
import { sequelize } from "../config/database.js";
import ExcelJS from "exceljs";

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

    // Capturar información de autoría
    const elaboradoPor = junta.UltimoEditor || null;
    const generadoPor = req.usuario?.nombre || null;

    // Obtener municipio (Lugar) si existe
    let nombreMunicipio = null;
    try {
      const lugar = await Lugar.findByPk(junta.IDMunicipio);
      if (lugar && lugar.NombreLugar) nombreMunicipio = lugar.NombreLugar;
    } catch (e) {
      // no bloquear: dejamos nombreMunicipio en null
      console.warn('No se pudo obtener el municipio:', e.message);
    }

    // Obtener dignatarios de la junta (orden estable por fecha de inserción)
    const mandatariosJunta = await MandatarioJunta.findAll({
      where: { IDJunta: IDJunta },
      order: [['IDMandatarioJunta', 'ASC']]
    });
    const dignatarios = [];

    for (const m of mandatariosJunta) {
      try {
        const u = await Usuario.findOne({ where: { NumeroIdentificacion: m.NumeroIdentificacion } });

        // Buscamos el Cargo (si tiene)
        const c = m.IDCargo ? await Cargo.findByPk(m.IDCargo) : null;

        // Buscamos la Comisión (si tiene)
        let nombreComision = null;
        if (m.IDComision) {
          // Asumiendo que el modelo se llama Comision
          const com = await Comisiones.findByPk(m.IDComision);
          if (com) nombreComision = com.Nombre;
        }

        // Buscamos el lugar de expedición del documento
        let expedidoEn = null;
        if (m.Expedido) {
          const lugarExp = await Lugar.findByPk(m.Expedido);
          if (lugarExp) expedidoEn = lugarExp.NombreLugar;
        }

        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;

        // Empujamos el objeto con AMBOS datos (cargo y comision)
        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          comision: nombreComision || null,
          nombre: nombre || null,
          cedula: m.NumeroIdentificacion,
          expedidoEn: expedidoEn || null
        });

      } catch (e) {
        console.warn('Error al obtener dignatario:', e.message);
      }
    }

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

    // Tipo de PDF: puede venir en el body; por defecto 'autoresolutorio'
    const { tipo } = req.body;
    const isAutoresolutorio = (!tipo || tipo === 'autoresolutorio');

    // --- Crear el certificado en BD (solo si es autoresolutorio) ---
    const ahora = new Date();
    let nuevoCertificado = null;

    if (isAutoresolutorio) {
      nuevoCertificado = await Certificados.create({
        FechaCreacion: ahora,
        IDJunta: junta.IDJunta,
        NombreCertificado: junta.RazonSocial || `Certificado_${ahora.toISOString()}`,
        TipoCertificado: tipoCertificadoValue,
        ElaboradoPor: elaboradoPor,
        GeneradoPor: generadoPor
      });
    }

    // Preparar datos para el PDF (solo con valores reales; si falta algo, se deja undefined/null)
    const datosCertificado = {
      FechaCreacion: ahora,
      IDCertificado: nuevoCertificado ? nuevoCertificado.IDCertificado : null,
      NombreMunicipio: nombreMunicipio || null,
      nombreOrganizacion: junta.RazonSocial || null,
      personeriaNumero: junta.NumPersoneriaJuridica || null,
      personeriaFecha: junta.FechaCreacion || null,
      periodoInicio: junta.FechaInicioPeriodo || null,
      periodoFin: junta.FechaFinPeriodo || null,
      dignatarios: dignatarios.length > 0 ? dignatarios : null,
      TipoCertificado: tipoNombre || null,
      fechaEleccion: junta.FechaAsamblea || null,
      elaboradoPor,
      generadoPor
    };

    // Generar el PDF con la fábrica de generadores. Los generadores deben manejar valores faltantes.
    const pdfBuffer = await generatePdf(tipo || 'autoresolutorio', datosCertificado);

    logOperation(
      "Certificado Generado",
      { IDJunta: IDJunta, IDCertificado: nuevoCertificado ? nuevoCertificado.IDCertificado : 'N/A (No Autoresolutorio)', Tipo: tipo || 'autoresolutorio' },
      'info'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=certificado_${nuevoCertificado ? nuevoCertificado.IDCertificado : (tipo || 'documento')}.pdf`);
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

export const previewCertificado = async (req, res) => {
  try {
    const { IDJunta } = req.body;

    if (!IDJunta) {
      return res.status(400).json({ error: 'Faltan parámetros: IDJunta es requerido' });
    }

    const junta = await Junta.findByPk(IDJunta);
    if (!junta) {
      return res.status(404).json({ error: 'No se encontró la junta proporcionada.' });
    }

    let nombreMunicipio = null;
    try {
      const lugar = await Lugar.findByPk(junta.IDMunicipio);
      if (lugar && lugar.NombreLugar) nombreMunicipio = lugar.NombreLugar;
    } catch (e) {
      console.warn('No se pudo obtener el municipio:', e.message);
    }

    const mandatariosJunta = await MandatarioJunta.findAll({
      where: { IDJunta: IDJunta },
      order: [['IDMandatarioJunta', 'ASC']]
    });
    const dignatarios = [];

    for (const m of mandatariosJunta) {
      try {
        const u = await Usuario.findOne({ where: { NumeroIdentificacion: m.NumeroIdentificacion } });
        const c = m.IDCargo ? await Cargo.findByPk(m.IDCargo) : null;

        let nombreComision = null;
        if (m.IDComision) {
          const com = await Comisiones.findByPk(m.IDComision);
          if (com) nombreComision = com.Nombre;
        }

        let expedidoEn = null;
        if (m.Expedido) {
          const lugarExp = await Lugar.findByPk(m.Expedido);
          if (lugarExp) expedidoEn = lugarExp.NombreLugar;
        }

        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;

        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          comision: nombreComision || null,
          nombre: nombre || null,
          cedula: m.NumeroIdentificacion,
          expedidoEn: expedidoEn || null
        });
      } catch (e) {
        console.warn('Error al obtener dignatario:', e.message);
      }
    }

    let tipoNombre = null;
    try {
      if (junta.TipoJunta) {
        const tipo = await TipoJunta.findByPk(junta.TipoJunta);
        if (tipo && tipo.NombreTipoJunta) tipoNombre = tipo.NombreTipoJunta;
      }
    } catch (e) {
      console.warn('Error al resolver TipoJunta:', e.message);
    }

    const ahora = new Date();
    const datosCertificado = {
      preview: true,
      FechaCreacion: ahora,
      IDCertificado: null,
      NombreMunicipio: nombreMunicipio || null,
      nombreOrganizacion: junta.RazonSocial || null,
      personeriaNumero: junta.NumPersoneriaJuridica || null,
      personeriaFecha: junta.FechaCreacion || null,
      periodoInicio: junta.FechaInicioPeriodo || null,
      periodoFin: junta.FechaFinPeriodo || null,
      dignatarios: dignatarios.length > 0 ? dignatarios : null,
      TipoCertificado: tipoNombre || null,
      fechaEleccion: junta.FechaAsamblea || null,
      elaboradoPor: junta.UltimoEditor || null,
      generadoPor: req.usuario?.nombre || null
    };

    const pdfBuffer = await generatePdf('autoresolutorio', datosCertificado);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=preview_autoresolutorio.pdf');
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("Error al generar preview:", err);
    res.status(500).json({ error: "Error al generar la vista previa.", detalle: err.message });
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

export const enviarAutoresolutorio = async (req, res) => {
  try {
    const { IDJunta } = req.body;

    const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000); // 1 hora

    const certificadoReciente = await Certificados.findOne({
      where: {
        IDJunta: IDJunta,
        FechaCreacion: {
          [Op.gte]: unaHoraAtras // Mayor o igual a hace una hora
        }
      }
    });

    if (certificadoReciente) {
      return res.status(429).json({
        error: "Ya se envió un certificado recientemente. Por seguridad, solo se permite una solicitud por hora."
      });
    }

    // 1. Validaciones básicas
    if (!IDJunta) {
      return res.status(400).json({ error: 'Faltan parámetros: IDJunta es requerido' });
    }

    const junta = await Junta.findByPk(IDJunta);
    if (!junta) {
      return res.status(404).json({ error: 'No se encontró la junta proporcionada.' });
    }

    if (!junta.Correo) {
      return res.status(400).json({ error: 'La junta seleccionada no tiene un correo electrónico registrado.' });
    }

    // --- Municipio ---
    let nombreMunicipio = 'No registrado';
    try {
      const lugar = await Lugar.findByPk(junta.IDMunicipio);
      if (lugar && lugar.NombreLugar) nombreMunicipio = lugar.NombreLugar;
    } catch (e) { console.warn('Warning Municipio:', e.message); }

    // --- Dignatarios ---
    const mandatariosJunta = await MandatarioJunta.findAll({
      where: { IDJunta: IDJunta },
      order: [['IDMandatarioJunta', 'ASC']]
    });
    const dignatarios = [];

    for (const m of mandatariosJunta) {
      try {
        const u = await Usuario.findOne({ where: { NumeroIdentificacion: m.NumeroIdentificacion } });
        const c = m.IDCargo ? await Cargo.findByPk(m.IDCargo) : null;

        let nombreComision = null;
        if (m.IDComision) {
          const com = await Comisiones.findByPk(m.IDComision);
          if (com) nombreComision = com.Nombre;
        }

        let expedidoEn = null;
        if (m.Expedido) {
          const lugarExp = await Lugar.findByPk(m.Expedido);
          if (lugarExp) expedidoEn = lugarExp.NombreLugar;
        }

        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;

        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          comision: nombreComision,
          nombre: nombre,
          cedula: m.NumeroIdentificacion,
          expedidoEn: expedidoEn || null
        });
      } catch (e) { console.warn('Warning Dignatario:', e.message); }
    }

    // --- Tipo Junta ---
    let tipoNombre = 'Junta de Acción Comunal'; // Valor por defecto visual
    try {
      if (junta.TipoJunta) {
        const tipo = await TipoJunta.findByPk(junta.TipoJunta);
        if (tipo) tipoNombre = tipo.NombreTipoJunta;
      }
    } catch (e) { console.warn('Warning TipoJunta:', e.message); }


    // 3. Registrar la generación en la base de datos (Historial)
    const nuevoCertificado = await Certificados.create({
      FechaCreacion: new Date(),
      IDJunta: junta.IDJunta,
      NombreCertificado: `Autoresolutorio enviado por correo - ${junta.RazonSocial}`,
      TipoCertificado: 'Autoresolutorio' // O el ID del tipo si lo manejas así
    });

    // 4. Generar el PDF en memoria (Buffer)
    const datosCertificado = {
      FechaCreacion: new Date(),
      IDCertificado: nuevoCertificado.IDCertificado,
      NombreMunicipio: nombreMunicipio,
      nombreOrganizacion: junta.RazonSocial,
      personeriaNumero: junta.NumPersoneriaJuridica,
      personeriaFecha: junta.FechaCreacion,
      periodoInicio: junta.FechaInicioPeriodo,
      periodoFin: junta.FechaFinPeriodo,
      dignatarios: dignatarios.length > 0 ? dignatarios : null,
      TipoCertificado: tipoNombre,
      fechaEleccion: junta.FechaAsamblea,
      generadoPor: 'Solicitud externa'
    };

    const pdfRaw = await generatePdf('autoresolutorio', datosCertificado);

    // 'autoresolutorio' es el tipo de template que usará tu pdfFactory
    const pdfBuffer = Buffer.from(pdfRaw);

    // 5. Configurar el correo con el adjunto
    const mailOptions = {
      from: `"Sistema de Juntas" <${process.env.EMAIL_USER}>`,
      to: junta.Correo,
      subject: `Documento Autoresolutorio - ${junta.RazonSocial}`,
      html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hola, Representante Legal de ${junta.RazonSocial}</h2>
                <p>Adjunto a este correo encontrará el documento <strong>Autoresolutorio</strong> generado automáticamente.</p>
                <p><strong>ID Documento:</strong> ${nuevoCertificado.IDCertificado}</p>
                <br>
                <p>Atentamente,<br>Equipo de Participación Ciudadana</p>
            </div>
        `,
      attachments: [
        {
          filename: `Autoresolutorio_${junta.RazonSocial.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          content: pdfBuffer, // Ahora sí es un Buffer compatible
          contentType: 'application/pdf'
        }
      ]
    };

    // 6. Enviar usando tu función existente
    await sendMail(mailOptions);
    logOperation(
      'Autoresolutorio Enviado por Correo',
      { IDJunta: IDJunta, Correo: junta.Correo },
      'info'
    );

    // 7. Responder al Frontend
    return res.status(200).json({
      success: true,
      message: `El documento ha sido enviado correctamente a ${junta.Correo}`
    });

  } catch (error) {
    console.error("Error en enviarAutoresolutorio:", error);
    logOperation('Error Envío Autoresolutorio', { error: error.message }, 'error');
    return res.status(500).json({
      success: false,
      error: "Ocurrió un error al generar o enviar el documento.",
      detalle: error.message
    });
  }
};

export const reporteAutoresolutorios = async (req, res) => {
  try {
    const total = await Certificados.count();

    const ultimo = await Certificados.findOne({
      order: [['IDCertificado', 'DESC']],
      attributes: ['IDCertificado']
    });

    const [porMunicipio] = await sequelize.query(`
      SELECT l.nombrelugar AS municipio, COUNT(c.idcertificado)::int AS total
      FROM certificados c
      JOIN juntas j ON c.idjunta = j.idjunta
      JOIN lugar l ON j.idmunicipio = l.idlugar
      GROUP BY l.nombrelugar
      ORDER BY total DESC
    `);

    res.json({
      total,
      ultimo: ultimo?.IDCertificado ?? 0,
      porMunicipio: {
        labels: porMunicipio.map(r => r.municipio),
        series: porMunicipio.map(r => Number(r.total))
      }
    });
  } catch (err) {
    console.error('Error en reporteAutoresolutorios:', err);
    res.status(500).json({ error: 'Error al generar el reporte de autoresolutorios', detalle: err.message });
  }
};

const LISTAR_CERTIFICADOS_SQL = `
  SELECT
    c.idcertificado,
    c.fechacreacion,
    c.idjunta,
    c.nombrecertificado,
    c.tipocertificado,
    c.elaborado_por,
    c.generado_por,
    j.razonsocial,
    l.nombrelugar AS municipio
  FROM public.certificados c
  INNER JOIN public.juntas j ON c.idjunta = j.idjunta
  LEFT JOIN public.lugar l ON j.idmunicipio = l.idlugar
  ORDER BY c.idcertificado DESC
`;

const mapCertificadoRow = (r) => ({
  IDCertificado: r.idcertificado,
  FechaCreacion: r.fechacreacion,
  IDJunta: r.idjunta,
  NombreCertificado: r.nombrecertificado,
  TipoCertificado: r.tipocertificado,
  ElaboradoPor: r.elaborado_por,
  GeneradoPor: r.generado_por,
  RazonSocial: r.razonsocial,
  Municipio: r.municipio
});

export const listarCertificados = async (req, res) => {
  try {
    const [rows] = await sequelize.query(LISTAR_CERTIFICADOS_SQL);
    return res.json(rows.map(mapCertificadoRow));
  } catch (err) {
    console.error('Error en listarCertificados:', err);
    return res.status(500).json({ error: 'Error al listar los certificados', detalle: err.message });
  }
};

const formatDateForExcel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  const hora = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${anio} ${hora}:${min}`;
};

export const exportarCertificadosExcel = async (req, res) => {
  try {
    const [rows] = await sequelize.query(LISTAR_CERTIFICADOS_SQL);
    const data = rows.map(mapCertificadoRow);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Autoresolutorios", {
      views: [{ state: "frozen", ySplit: 4 }]
    });

    const headers = [
      "ID",
      "Fecha Creación",
      "Razón Social",
      "Municipio",
      "Tipo Certificado",
      "Nombre Certificado",
      "Elaborado Por",
      "Generado Por"
    ];

    const totalColumns = headers.length;
    const lastColumn = String.fromCharCode(64 + totalColumns);

    sheet.mergeCells(`A1:${lastColumn}1`);
    sheet.getCell("A1").value = "Reporte de Autoresolutorios";
    sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
    sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
    sheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF009E76" }
    };
    sheet.getRow(1).height = 26;

    sheet.mergeCells(`A2:${lastColumn}2`);
    sheet.getCell("A2").value = `Total de registros: ${data.length}`;
    sheet.getCell("A2").font = { italic: true, size: 11, color: { argb: "FF444444" } };
    sheet.getCell("A2").alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(2).height = 22;

    sheet.mergeCells(`A3:${lastColumn}3`);
    sheet.getCell("A3").value = `Fecha de generación: ${formatDateForExcel(new Date())}`;
    sheet.getCell("A3").font = { size: 10, color: { argb: "FF666666" } };
    sheet.getCell("A3").alignment = { vertical: "middle", horizontal: "left" };
    sheet.getRow(3).height = 18;

    headers.forEach((header, index) => {
      const cell = sheet.getCell(4, index + 1);
      cell.value = header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF005F4B" }
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFFFFFFF" } },
        left: { style: "thin", color: { argb: "FFFFFFFF" } },
        right: { style: "thin", color: { argb: "FFFFFFFF" } },
        bottom: { style: "thin", color: { argb: "FFFFFFFF" } }
      };
    });
    sheet.getRow(4).height = 22;

    data.forEach((item, rowIndex) => {
      const rowNumber = 5 + rowIndex;
      const values = [
        item.IDCertificado,
        formatDateForExcel(item.FechaCreacion),
        item.RazonSocial || "",
        item.Municipio || "",
        item.TipoCertificado || "",
        item.NombreCertificado || "",
        item.ElaboradoPor || "",
        item.GeneradoPor || ""
      ];
      values.forEach((value, columnIndex) => {
        const cell = sheet.getCell(rowNumber, columnIndex + 1);
        cell.value = value ?? "";
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD6D6D6" } },
          left: { style: "thin", color: { argb: "FFD6D6D6" } },
          right: { style: "thin", color: { argb: "FFD6D6D6" } },
          bottom: { style: "thin", color: { argb: "FFD6D6D6" } }
        };
        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF7F9F8" }
          };
        }
      });
    });

    const widths = [10, 20, 38, 22, 22, 38, 26, 26];
    widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: totalColumns }
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `autoresolutorios-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Error en exportarCertificadosExcel:', err);
    res.status(500).json({ error: 'Error al exportar los certificados', detalle: err.message });
  }
};