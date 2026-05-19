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

const formatDateLong = (date) => {
  if (!date) return '____';
  const zdt = parseToBogota(date);
  if (!zdt) return '____';
  const mes = MESES_ES[zdt.month - 1];
  return `${zdt.day} DE ${mes.toUpperCase()} DE ${zdt.year}`;
};

const clasificarComision = (nombreComision) => {
  const n = (nombreComision || '').toLowerCase();
  if (n.includes('convivencia') || n.includes('conciliaci')) {
    return 'COMISION DE CONVIVENCIA Y CONCILIACION';
  }
  if (n.includes('empresarial')) return 'COMISION EMPRESARIAL';
  return 'COMISIONES DE TRABAJO';
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

const generarConsulta = async (datosCertificado) => {
  const doc = createDoc();

  const resources = await addPDFHeader(doc, datosCertificado);

  let yPos = 50;
  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = DEFAULTS.anchoPagina - margenIzq - margenDer;

  centerText(doc, 'CONSULTA DE DIGNATARIOS', yPos, 12, 'bold');
  yPos += 10;

  const nombreOrg = datosCertificado.nombreOrganizacion || '';
  const municipio = datosCertificado.NombreMunicipio || '';
  const personeriaNumero = datosCertificado.personeriaNumero || '____';
  const personeriaFecha = datosCertificado.personeriaFecha ? formatDateLong(datosCertificado.personeriaFecha) : '____';

  if (nombreOrg) {
    centerText(doc, nombreOrg.toUpperCase(), yPos, 10, 'bold');
    yPos += 7;
  }
  if (municipio) {
    centerText(doc, `Municipio de ${municipio}`, yPos, 10, 'normal');
    yPos += 7;
  }
  centerText(doc, `CON PERSONERIA N° ${personeriaNumero} DE FECHA ${personeriaFecha}`, yPos, 10, 'normal');
  yPos += 10;

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
    doc.text('[SIN DIGNATARIOS REGISTRADOS]', margenIzq + 10, yPos);
    yPos += 10;
  }

  return doc.output('arraybuffer');
};

export default generarConsulta;
