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
        
        // Buscamos el Cargo (si tiene)
        const c = m.IDCargo ? await Cargo.findByPk(m.IDCargo) : null;
        
        // Buscamos la Comisión (si tiene)
        let nombreComision = null;
        if (m.IDComision) {
            // Asumiendo que el modelo se llama Comision
            const com = await Comisiones.findByPk(m.IDComision); 
            if (com) nombreComision = com.Nombre; 
        }

        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;
        
        // Empujamos el objeto con AMBOS datos (cargo y comision)
        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          comision: nombreComision || null,
          nombre: nombre || null,
          cedula: m.NumeroIdentificacion
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
    const mandatariosJunta = await MandatarioJunta.findAll({ where: { IDJunta: IDJunta } });
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

        const nombre = u ? `${u.PrimerNombre || ''} ${u.SegundoNombre || ''} ${u.PrimerApellido || ''} ${u.SegundoApellido || ''}`.replace(/\s+/g, ' ').trim() : null;
        
        dignatarios.push({
          cargo: c ? c.NombreCargo : null,
          comision: nombreComision,
          nombre: nombre,
          cedula: m.NumeroIdentificacion
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
      personeriaFecha: junta.FechaAsamblea,
      periodoInicio: junta.FechaInicioPeriodo,
      periodoFin: junta.FechaFinPeriodo,
      dignatarios: dignatarios.length > 0 ? dignatarios : null,
      TipoCertificado: tipoNombre
    };

    // 'autoresolutorio' es el tipo de template que usará tu pdfFactory
    const pdfBuffer = await generatePdf('autoresolutorio', datosCertificado);

    // 5. Configurar el correo con el adjunto
    const mailOptions = {
        from: `"Sistema de Juntas" <${process.env.EMAIL_USER}>`,
        to: junta.Correo,
        subject: `Documento Autoresolutorio - ${junta.RazonSocial}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Hola, Representante Legal de ${junta.RazonSocial}</h2>
                <p>Adjunto a este correo encontrará el documento <strong>Autoresolutorio</strong> generado automáticamente por nuestro sistema.</p>
                <p><strong>Detalles:</strong></p>
                <ul>
                    <li><strong>ID Documento:</strong> ${nuevoCertificado.IDCertificado}</li>
                    <li><strong>Fecha de emisión:</strong> ${new Date().toLocaleDateString()}</li>
                </ul>
                <p>Por favor, descargue y verifique la información.</p>
                <br>
                <p>Atentamente,<br>Equipo de Participación Ciudadana</p>
            </div>
        `,
        attachments: [
            {
                filename: `Autoresolutorio_${junta.RazonSocial.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, // Nombre limpio del archivo
                content: pdfBuffer,
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