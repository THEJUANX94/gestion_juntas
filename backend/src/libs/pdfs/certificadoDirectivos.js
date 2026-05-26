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

const parseToBogota = (date) => {
  if (!date) return null;
  if (date instanceof Date) return Temporal.Instant.fromEpochMilliseconds(date.getTime()).toZonedDateTimeISO(BOGOTA);
  if (typeof date === 'number') return Temporal.Instant.fromEpochMilliseconds(date).toZonedDateTimeISO(BOGOTA);
  try {
    return Temporal.Instant.from(date).toZonedDateTimeISO(BOGOTA);
  } catch {
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

const getCargoRank = (cargo) => {
  const lower = (cargo || '').toLowerCase().trim();
  if (lower.includes('vicepresidente')) return 1;
  if (lower.includes('presidente')) return 0;
  if (lower.includes('tesorero')) return 2;
  if (lower.includes('secretario')) return 3;
  return -1;
};

const compareCargos = (cargoA, cargoB) => {
  const lowerA = (cargoA || '').toLowerCase().trim();
  const lowerB = (cargoB || '').toLowerCase().trim();

  const rankA = getCargoRank(lowerA);
  const rankB = getCargoRank(lowerB);

  const rA = rankA === -1 ? 4 : rankA;
  const rB = rankB === -1 ? 4 : rankB;

  if (rA !== rB) {
    return rA - rB;
  }

  const isSuplenteA = lowerA.includes('suplente');
  const isSuplenteB = lowerB.includes('suplente');

  if (isSuplenteA && !isSuplenteB) return 1;
  if (!isSuplenteA && isSuplenteB) return -1;

  return lowerA.localeCompare(lowerB, 'es', { sensitivity: 'base' });
};


const generarCertificadoDirectivos = async (datosCertificado) => {
  const doc = createDoc();

  const municipio = (datosCertificado.NombreMunicipio || '').toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion || '').toUpperCase();
  const personeriaNumero = datosCertificado.personeriaNumero || '____';
  const personeriaFecha = datosCertificado.personeriaFecha ? formatDateLong(datosCertificado.personeriaFecha) : '____';
  const periodoFin = datosCertificado.periodoFin;
  const tipodocumento = (datosCertificado.TipoCertificado || 'JUNTA DE ACCIÓN COMUNAL').toUpperCase();

  const { margenIzq, margenDer } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;

  const resources = await addPDFHeader(doc, datosCertificado);

  let yPos = 43;
  let result;

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

  // ── ENCABEZADO DE SECCIÓN ──
  centerText(doc, 'SECRETARÍA DE GOBIERNO Y ACCIÓN COMUNAL', yPos, 11, 'bold');
  yPos += 6;
  centerText(doc, 'DIRECCIÓN DE PARTICIPACIÓN Y ACCIÓN COMUNAL', yPos, 11, 'bold');
  yPos += 12;

  // ── PREÁMBULO ──
  yPos = writePara(
    'El(A) Director(a) de Participación y Acción Comunal en uso de sus facultades legales y en especial las que le confiere la ley 52 de 1990, la ley 2166 del 18 de diciembre de 2021 y el Decreto 1066 del 2015 y Decreto Departamental 076 de 30 de Enero de 2019.',
    yPos
  );
  yPos += 5;

  // ── CERTIFICA ──
  centerText(doc, 'CERTIFICA:', yPos, 12, 'bold');
  yPos += 10;

  // ── CUERPO ──
  yPos = writePara(
    `Que la ${tipodocumento} ${nombreOrganizacion} del municipio de ${municipio}, Departamento de Boyacá, cuenta con Personería Jurídica otorgada mediante resolución No.${personeriaNumero} de fecha ${personeriaFecha}, expedida por Gobernación de Boyacá.`,
    yPos
  );
  yPos += 3;

  yPos = writePara('Que los dignatarios inscritos en la Junta de Acción Comunal antes nombrada son:', yPos);
  yPos += 5;

  // ── TABLA DE DIGNATARIOS (presidente, vicepresidente, tesorero, secretario) ──
  const dignatariosTabla = (datosCertificado.dignatarios || [])
    .filter(d => getCargoRank(d.cargo) !== -1)
    .sort((a, b) => compareCargos(a.cargo, b.cargo));

  if (dignatariosTabla.length > 0) {
    const colWidths = [35, 65, 25, 35];
    const totalW = colWidths.reduce((a, b) => a + b, 0);
    const HEADER_H = 7;
    const headers = ['CARGO', 'NOMBRE Y APELLIDO', 'DOCUMENTO', 'EXPEDIDO EN'];

    result = checkPageBreak(doc, yPos, HEADER_H + 2);
    yPos = result.yPos;

    doc.setFillColor(230, 230, 230);
    doc.rect(margenIzq, yPos, totalW, HEADER_H, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    let hx = margenIzq;
    headers.forEach((h, i) => {
      if (i > 0) doc.line(hx, yPos, hx, yPos + HEADER_H);
      doc.text(h, hx + 2, yPos + 5);
      hx += colWidths[i];
    });
    doc.rect(margenIzq, yPos, totalW, HEADER_H);
    yPos += HEADER_H;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    dignatariosTabla.forEach(d => {
      const cargo = (d.cargo || d.comision || '').toString();
      const nombre = (d.nombre || '').toUpperCase();
      const cedula = (d.cedula || '').toString();
      const expedido = (d.expedidoEn || municipio || '').toUpperCase();

      const cells = [
        doc.splitTextToSize(cargo, colWidths[0] - 4),
        doc.splitTextToSize(nombre, colWidths[1] - 4),
        doc.splitTextToSize(cedula, colWidths[2] - 4),
        doc.splitTextToSize(expedido, colWidths[3] - 4),
      ];
      const maxLines = Math.max(...cells.map(c => c.length));
      const rowH = Math.max(7, maxLines * 4 + 3);

      result = checkPageBreak(doc, yPos, rowH);
      yPos = result.yPos;

      doc.rect(margenIzq, yPos, totalW, rowH);
      let cx = margenIzq;
      cells.forEach((lines, i) => {
        if (i > 0) doc.line(cx, yPos, cx, yPos + rowH);
        doc.text(lines, cx + 2, yPos + 4);
        cx += colWidths[i];
      });
      yPos += rowH;
    });

    yPos += 5;
  }

  // ── TEXTOS FINALES ──
  yPos = writePara(`Que el periodo de los dignatarios vence el ${formatDateLong(periodoFin)}`, yPos);
  yPos += 2;
  yPos = writePara('Esta constancia es válida por el termino de 6 (seis) meses.', yPos);
  yPos += 2;
  yPos = writePara('Se expide con el fin de adelantar tramites del organismo comunal', yPos);
  yPos += 10;

  // ── FOOTER ──
  result = checkPageBreak(doc, yPos, 75);
  yPos = result.yPos;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Dada en Tunja el día: ${formatDateSlash(datosCertificado.FechaCreacion)}`, margenIzq, yPos);
  yPos += 15;

  const anchoFirma = 50;
  const altoFirma = 25;
  const xFirma = (210 - anchoFirma) / 2;

  if (resources.base64Firma) {
    doc.addImage(resources.base64Firma, 'PNG', xFirma, yPos, anchoFirma, altoFirma);
    yPos += altoFirma + 3;
  } else {
    yPos += 20;
  }

  centerText(doc, resources.nombreFirmante || 'NOMBRE FIRMANTE', yPos, 11, 'bold');
  yPos += 5;
  centerText(doc, resources.cargoFirmante || 'CARGO FIRMANTE', yPos, 10, 'normal');
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

export default generarCertificadoDirectivos;
