import { Temporal } from 'temporal-polyfill';
import {
  createDoc,
  addPDFHeader,
  centerText,
  checkPageBreak,
  DEFAULTS
} from '../pdfBase.js';

const BOGOTA = 'America/Bogota';

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const clasificarComision = (nombreComision) => {
  const n = (nombreComision || '').toLowerCase();
  if (n.includes('convivencia') || n.includes('conciliaci')) {
    return 'COMISION DE CONVIVENCIA Y CONCILIACION';
  }
  if (n.includes('empresarial')) return 'COMISION EMPRESARIAL';
  return 'COMISIONES DE TRABAJO';
};

const parseToBogota = (date) => {
  if (!date) return null;
  // JS Date objects (TIMESTAMP columns via Sequelize/pg): epoch-based, convert from UTC
  if (date instanceof Date) {
    return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(BOGOTA);
  }
  if (typeof date === 'number') {
    return Temporal.Instant.fromEpochMilliseconds(date).toZonedDateTimeISO(BOGOTA);
  }
  try {
    // ISO strings with offset/Z: treat as instants
    return Temporal.Instant.from(date).toZonedDateTimeISO(BOGOTA);
  } catch {
    // Plain date strings "YYYY-MM-DD" from pg DATE columns: these represent Bogota calendar dates
    return Temporal.PlainDate.from(String(date)).toZonedDateTime({ timeZone: BOGOTA });
  }
};

const formatDateSlash = (date) => {
  if (!date) return '____';
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  return `${String(zdt.day).padStart(2, '0')}/${String(zdt.month).padStart(2, '0')}/${zdt.year}`;
};

const formatDateLong = (date) => {
  if (!date) return '____';
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  const mes = MESES_ES[zdt.month - 1];
  return `${zdt.day} de ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${zdt.year}`;
};

const makeTableDrawer = (doc, anchoUtil, margenIzq) => {
  const colWidths = [35, 65, 25, 35];
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const HEADER_H = 7;

  return (title, col1Header, rows, startY) => {
    let y = startY;
    let r;

    r = checkPageBreak(doc, y, 20);
    y = r.yPos;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const tw = doc.getTextWidth(title);
    doc.text(title, margenIzq + (anchoUtil - tw) / 2, y);
    y += 6;

    r = checkPageBreak(doc, y, HEADER_H + 2);
    y = r.yPos;

    doc.setFillColor(230, 230, 230);
    doc.rect(margenIzq, y, totalW, HEADER_H, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    const headers = [col1Header, 'NOMBRE Y APELLIDO', 'DOCUMENTO', 'EXPEDIDO EN'];
    let hx = margenIzq;
    headers.forEach((h, i) => {
      if (i > 0) doc.line(hx, y, hx, y + HEADER_H);
      doc.text(h, hx + 2, y + 5);
      hx += colWidths[i];
    });
    doc.rect(margenIzq, y, totalW, HEADER_H);
    y += HEADER_H;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    rows.forEach(row => {
      const cells = row.map((cell, i) =>
        doc.splitTextToSize((cell || '').toString(), colWidths[i] - 4)
      );
      const maxLines = Math.max(...cells.map(c => c.length));
      const rowH = Math.max(7, maxLines * 4 + 3);

      r = checkPageBreak(doc, y, rowH);
      y = r.yPos;

      doc.rect(margenIzq, y, totalW, rowH);
      let cx = margenIzq;
      cells.forEach((lines, i) => {
        if (i > 0) doc.line(cx, y, cx, y + rowH);
        doc.text(lines, cx + 2, y + 4);
        cx += colWidths[i];
      });
      y += rowH;
    });

    return y + 4;
  };
};

const generarAutoresolutorio = async (datosCertificado) => {
  const doc = createDoc();

  const municipio = (datosCertificado.NombreMunicipio || '').toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion || '').toUpperCase();
  const personeriaNumero = datosCertificado.personeriaNumero || '____';
  const personeriaFecha = datosCertificado.personeriaFecha ? formatDateLong(datosCertificado.personeriaFecha) : '____';
  const periodoInicio = datosCertificado.periodoInicio;
  const periodoFin = datosCertificado.periodoFin;
  const tipodocumento = (datosCertificado.TipoCertificado || 'JUNTA DE ACCIÓN COMUNAL').toUpperCase();
  const fechaEleccion = datosCertificado.fechaEleccion
    ? formatDateLong(datosCertificado.fechaEleccion)
    : '____';

  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;

  const resources = await addPDFHeader(doc, datosCertificado);

  let yPos = 38;
  centerText(doc, `AUTO No. ${datosCertificado.IDCertificado || '____'}`, yPos, 10, 'bold');
  yPos += 6;
  centerText(doc, `(${formatDateSlash(datosCertificado.FechaCreacion)})`, yPos, 10, 'bold');
  yPos += 8;
  let result;

  const writeArticle = (label, body, currentY) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const labelW = doc.getTextWidth(label + ' ');
    const firstAvail = anchoUtil - labelW;

    const words = body.trim().split(' ');
    let firstLine = '';
    let wi = 0;
    doc.setFont('helvetica', 'normal');
    while (wi < words.length) {
      const test = firstLine + (firstLine ? ' ' : '') + words[wi];
      if (doc.getTextWidth(test) <= firstAvail) { firstLine = test; wi++; } else break;
    }
    const remainBody = words.slice(wi).join(' ');
    const remainLines = remainBody ? doc.splitTextToSize(remainBody, anchoUtil) : [];
    const h = (1 + remainLines.length) * 5 + 8;

    let r = checkPageBreak(doc, currentY, h);
    let y = r.yPos;

    doc.setFont('helvetica', 'bold');
    doc.text(label, margenIzq, y);
    doc.setFont('helvetica', 'normal');
    doc.text(firstLine, margenIzq + labelW, y);

    if (remainLines.length > 0) {
      y += 5;
      doc.text(remainLines, margenIzq, y, { align: 'justify', maxWidth: anchoUtil });
      y += remainLines.length * 5;
    } else {
      y += 5;
    }
    return y + 5;
  };

  const writePara = (text, currentY, fontSize = 10, indent = 0) => {
    const w = anchoUtil - indent;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, w);
    const h = lines.length * 5 + 3;
    let r = checkPageBreak(doc, currentY, h);
    let y = r.yPos;
    doc.text(lines, margenIzq + indent, y, { align: 'justify', maxWidth: w });
    return y + h;
  };

  // ── TÍTULO ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const tituloPartes = [
    'POR MEDIO DE LA CUAL SE REALIZA LA INSCRIPCIÓN Y',
    `RECONOCIMIENTO DE DIGNATARIOS ELEGIDOS POR LA ${tipodocumento}`,
    `${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}`,
    `CON PERSONERIA N° ${personeriaNumero} DE FECHA ${personeriaFecha}`
  ];

  tituloPartes.forEach(parte => {
    const split = doc.splitTextToSize(parte, anchoUtil);
    split.forEach(l => { centerText(doc, l, yPos, 10, 'bold'); yPos += 5; });
  });
  yPos += 4;

  centerText(doc, 'LA DIRECCIÓN DE PARTICIPACIÓN Y ACCIÓN COMUNAL DE LA SECRETARIA', yPos, 10, 'bold');
  yPos += 5;
  centerText(doc, 'DE GOBIERNO Y ACCIÓN COMUNAL DE LA GOBERNACIÓN DE BOYACÁ', yPos, 10, 'bold');
  yPos += 10;

  // ── PREÁMBULO LEGAL ──
  yPos = writePara(
    'En ejercicio de las facultades y competencias legales previstas en la Ley 1437 de 2011; Ley 2166 del 18 de diciembre de 2021, Ley 2200 de 2022, el Decreto Único Reglamentario N° 1066 de 2015, el Decreto 1501 del 13 de septiembre de 2023 y la Circular 09 del 22 de diciembre de 2025, expedida por el Ministerio del Interior y, en especial la Ordenanza 049 de 2018, emitida por la Asamblea de Boyacá y el Decreto Departamental 076 de 30 de enero de 2019 proferido por el Gobernador de Boyacá,',
    yPos
  );
  yPos += 2;

  centerText(doc, 'CONSIDERANDO:', yPos, 10, 'bold');
  yPos += 8;

  // ── CONSIDERANDOS ──

  // 1
  yPos = writePara(
    'Que el numeral 4, Artículo 76 de la Ley 2166 de 2021, señala que es función de las Entidades que ejercen Inspección, Vigilancia y Control:',
    yPos
  );
  yPos = writePara(
    " ''Expedir los actos administrativos de reconocimiento, suspensión y cancelación de la personería jurídica de los organismos comunales.''",
    yPos, 10, 5
  );

  // 2
  yPos = writePara(
    "Que el numeral 7, Artículo 38 de la Ordenanza No. 049 del 6 de diciembre de 2018, estableció que la Secretaría de Gobierno y Acción Comunal, está compuesta entre otras, por la Dirección de Participación y Acción Comunal, la cual tiene como función:",
    yPos
  );
  yPos = writePara(
    "'Ejercer las funciones de Inspección, Control y Vigilancia de los organismos de acción comunal de primero y segundo grado que existan en el Departamento.'",
    yPos, 10, 5
  );

  // 3
  yPos = writePara(
    `Que la elección de dignatarios de la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, se llevó a cabo el día ${fechaEleccion} de conformidad con la ley 2166 de 2021, el Decreto 1501 de 2023 y la circular 009 del 22 de diciembre de 2025.`,
    yPos
  );

  // 4
  yPos = writePara(
    'Que de conformidad con lo previsto en el Articulo 2.3.2.1.3.2. del Decreto 1501 de 2023, para efectos de la inscripción de dignatarios ante la entidad que ejerce Inspección, Vigilancia y Control, se deberá acreditar los siguientes requisitos, así:',
    yPos
  );
  const items4 = [
    '1. Convocatoria a elección del tribunal de garantías.',
    '2. Acta de constitución del tribunal de garantías.',
    '3. Convocatoria a elección de dignatarios.',
    '4. Acta de asamblea de elección de dignatarios, suscrita por el Presidente y Secretario de la asamblea, así como por los miembros del Tribunal de Garantías.',
    '5. Copia del libro de afiliados vigente.',
    '6. Listado de asistentes a la Asamblea General.',
    '7. Copia de las cédulas de ciudadanía de los dignatarios elegidos.',
    '8. Planchas o listas presentadas a las elecciones.'
  ];
  items4.forEach(item => { yPos = writePara(item, yPos, 10, 5); });

  // 5 — análisis jurídico
  yPos = writePara(
    `Con el objeto de verificar el cumplimiento de los requisitos mínimos de validez de la elección de dignatarios, la Dirección de Participación y Acción Comunal procedió con el análisis jurídico de la documentación aportada por la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, encontrando que se ajusta de manera íntegra con los requisitos establecidos en la Ley 2166 de 2021 y el artículo 2.3.2.1.3.2. del Decreto 1501 de 2023.`,
    yPos
  );

  // Cierre
  yPos = writePara(
    'Con fundamento en las anteriores consideraciones, la Dirección de Participación y Acción Comunal, en uso de sus facultades legales,',
    yPos
  );
  yPos += 3;

  centerText(doc, 'RESUELVE:', yPos, 10, 'bold');
  yPos += 10;

  // ── ARTÍCULO PRIMERO ──
  yPos = writeArticle(
    'ARTÍCULO PRIMERO:',
    ` Inscribir y Reconocer como dignatarios en la ${tipodocumento} ${nombreOrganizacion} del municipio de ${municipio}, Departamento de Boyacá, para el periodo comprendido entre el ${formatDateLong(periodoInicio)} hasta el ${formatDateLong(periodoFin)} a los siguientes:`,
    yPos
  );

  // Type subtitle before tables
  result = checkPageBreak(doc, yPos, 12);
  yPos = result.yPos;
  centerText(doc, tipodocumento, yPos, 10, 'bold');
  yPos += 7;

  // ── TABLAS DE DIGNATARIOS ──
  const drawTable = makeTableDrawer(doc, anchoUtil, margenIzq);

  if (datosCertificado.dignatarios && datosCertificado.dignatarios.length > 0) {
  const directivos = [];
  const fiscales = [];
  const delegados = [];
  const comisionesAgrupadas = {
    'COMISION DE CONVIVENCIA Y CONCILIACION': [],
    'COMISIONES DE TRABAJO': [],
    'COMISION EMPRESARIAL': []
  };

  datosCertificado.dignatarios.forEach(d => {
    const cargo = (d.cargo || '').trim();
    const cargoLower = cargo.toLowerCase();
    const comision = (d.comision || '').trim();
    const expedido = (d.expedidoEn || municipio || '').toUpperCase();
    const nombre = (d.nombre || '').toUpperCase();
    const cedula = (d.cedula || '').toString();

    if (comision) {
      const categoria = clasificarComision(comision);
      comisionesAgrupadas[categoria].push([cargo || comision, nombre, cedula, expedido]);
    } else if (cargoLower.includes('conciliador')) {
      comisionesAgrupadas['COMISION DE CONVIVENCIA Y CONCILIACION'].push([cargo, nombre, cedula, expedido]);
    } else if (cargoLower.includes('fiscal')) {
      fiscales.push([cargo, nombre, cedula, expedido]);
    } else if (cargoLower.includes('delegado')) {
      delegados.push([cargo, nombre, cedula, expedido]);
    } else {
      directivos.push([cargo, nombre, cedula, expedido]);
    }
  });

  const CARGO_ORDER = ['presidente', 'vicepresidente', 'tesorero', 'secretario'];
  directivos.sort((a, b) => {
    const ai = CARGO_ORDER.findIndex(o => a[0].toLowerCase().includes(o));
    const bi = CARGO_ORDER.findIndex(o => b[0].toLowerCase().includes(o));
    return (ai === -1 ? CARGO_ORDER.length : ai) - (bi === -1 ? CARGO_ORDER.length : bi);
  });

  if (directivos.length > 0) {
    yPos = drawTable('DIRECTIVOS', 'CARGO', directivos, yPos);
  }
  if (fiscales.length > 0) {
    yPos = drawTable('FISCAL', 'CARGO', fiscales, yPos);
  }
  Object.entries(comisionesAgrupadas).forEach(([titulo, rows]) => {
    if (rows.length > 0) {
      yPos = drawTable(titulo, 'CARGO', rows, yPos);
    }
  });
  if (delegados.length > 0) {
    yPos = drawTable('DELEGADOS ANTE LA ORGANIZACION DE GRADO SUPERIOR', 'CARGO', delegados, yPos);
  }
} else {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('[ESPACIO PARA LISTADO DE DIGNATARIOS]', margenIzq + 10, yPos);
  yPos += 10;
}

  yPos += 5;

  // ── ARTÍCULO SEGUNDO ──
  yPos = writeArticle(
    'ARTÍCULO SEGUNDO:',
    ` Notificar el presente acto administrativo al representante legal o quien haga sus veces, de la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, conforme a lo establecido en ley 1437 de 2011 articulo 70.`,
    yPos
  );

  // ── ARTÍCULO TERCERO ──
  yPos = writeArticle(
    'ARTÍCULO TERCERO:',
    ' Contra el presente Auto procede el recurso de reposición de conformidad con el artículo 76 de la Ley 1437 de 2011.',
    yPos
  );
  yPos += 5;

  // ── FOOTER ──
  result = checkPageBreak(doc, yPos, 75);
  yPos = result.yPos;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Dado el día: ${formatDateSlash(datosCertificado.FechaCreacion)}`, margenIzq, yPos);

  centerText(doc, 'COMUNÍQUESE Y CÚMPLASE', yPos, 10, 'bold');
  yPos += 12;

  // Firma
  const anchoFirma = 50;
  const altoFirma = 25;
  const xFirma = (210 - anchoFirma) / 2;

  if (resources.base64Firma) {
    doc.addImage(resources.base64Firma, 'PNG', xFirma, yPos, anchoFirma, altoFirma);
    yPos += altoFirma + 3;
  } else {
    yPos += 20;
  }

  centerText(doc, resources.nombreFirmante || 'OLGA LUCIA SOTO GONZALEZ', yPos, 11, 'bold');
  yPos += 5;
  centerText(doc, resources.cargoFirmante || 'DIRECTORA DE PARTICIPACION Y ACCION COMUNAL', yPos, 10, 'normal');
  yPos += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Elaboró y generó:', margenIzq, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Elaboró: ${datosCertificado.elaboradoPor || '________________'}`, margenIzq, yPos);
  yPos += 5;
  doc.text(`Generó: ${datosCertificado.generadoPor || '________________'}`, margenIzq, yPos);
  yPos += 8;

  doc.setFontSize(10);

  return doc.output('arraybuffer');
};

export default generarAutoresolutorio;
