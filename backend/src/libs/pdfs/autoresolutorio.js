import {
  createDoc,
  addPDFHeader,
  centerText,
  checkPageBreak,
  DEFAULTS
} from '../pdfBase.js';

const formatDateSlash = (date) => {
  if (!date) return '____';
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

const formatDateLong = (date) => {
  if (!date) return '____';
  const d = new Date(date);
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
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
  const personeriaFecha = datosCertificado.personeriaFecha || '____';
  const periodoInicio = datosCertificado.periodoInicio;
  const periodoFin = datosCertificado.periodoFin;
  const tipodocumento = (datosCertificado.TipoCertificado || 'JUNTA DE ACCIÓN COMUNAL').toUpperCase();

  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;

  const resources = await addPDFHeader(doc, datosCertificado);

  // AUTO number in header band, right-aligned before QR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const autoText = `AUTO No. ${datosCertificado.IDCertificado || '____'} DE ${formatDateSlash(datosCertificado.FechaCreacion)}`;
  doc.text(autoText, 168, 20, { align: 'right' });

  let yPos = 43;
  let result;

  // Helper: write inline article (bold label + normal body on same line)
  const writeArticle = (label, body, currentY) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const labelW = doc.getTextWidth(label + ' ');
    const firstAvail = anchoUtil - labelW;

    // Word-fit first line after label
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

  // Helper: write paragraph (normal or small)
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
    'En ejercicio de las facultades y competencias legales previstas en la Ley 1437 de 2011; Ley  2166 del 18 de diciembre de 2021, Ley 2200 de 2022, el Decreto Único Reglamentario N° 1066 de 2015; las Resoluciones 1513 de 22 de septiembre de 2021 y 0108 de 26 de enero de 2022, expedidas por el Ministerio del Interior y, en especial la Ordenanza 049 de 2018, emitida por la Asamblea de Boyacá y el Decreto Departamental 076 de 30 de enero de 2019 proferido por el Gobernador de Boyacá,',
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
    'Que la Ordenanza No. 049 del 6 de Diciembre de 2018, estableció que la Secretaría de Gobierno y Acción Comunal, está compuesta  entre otras, por la Dirección de Participación y Acción Comunal, la cual tiene como función:',
    yPos
  );
  yPos = writePara(
    '7. Ejercer las funciones de Inspección, Control y Vigilancia de los organismos de acción comunal de primero y segundo grado que existan en el Departamento.',
    yPos, 8, 5
  );

  // 3
  yPos = writePara(
    'Que el literal A del Artículo 1 de la Resolución 0108 del 2022, estableció que:',
    yPos
  );
  yPos = writePara(
    "''Las Juntas de Acción Comunal y Juntas de Vivienda Comunitaria que no llevaron a cabo las elecciones el pasado 28 de noviembre de 2021, podrán celebrar las elecciones el 24 de abril de 2022 y su periodo iniciará el primero de julio del mismo año.''",
    yPos, 10, 5
  );

  // 4
  yPos = writePara(
    `Que en razón a que la elección de dignatarios de la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, se llevó a cabo el día 24 de Abril de 2022 y en esa medida, se adelantó en vigencia de la Ley 2166 de 2021 y el Decreto 1066 de 2015, es oportuno aplicar la referida normativa para el estudio de los requisitos establecidos para la elección y posterior inscripción de dignatarios.`,
    yPos
  );

  // 5
  yPos = writePara(
    'Que de conformidad con lo previsto en el Artículo 2.3.2.2.18 del Decreto Único 1066 de 2015, para efectos de la inscripción de dignatarios ante la entidad que ejerce Inspección, Vigilancia y Control, se deberá acreditar los siguientes requisitos, así:',
    yPos
  );
  const items5 = [
    '1. Original del Acta de Asamblea General, suscrita por el Presidente y Secretario de la asamblea, así como por los miembros del Tribunal de Garantías, de la elección de dignatarios o en su defecto, copia de la misma, certificada por el secretario del organismo de acción comunal.',
    '2. Listado original de asistentes a la Asamblea General.',
    '3. Planchas o Listas presentadas.',
    '4. Los demás documentos que tengan relación directa con la elección.',
    '5. El cumplimiento de los requisitos mínimos para la validez de la Asamblea General, tales como el quórum, participación del tribunal de garantías, entre otros.'
  ];
  items5.forEach(item => { yPos = writePara(item, yPos, 8, 5); });

  // 6
  yPos = writePara(
    `Con el objeto de verificar el cumplimiento de los requisitos mínimos de validez de la elección de dignatarios, la Dirección de Participación y Acción Comunal procedió con el análisis jurídico de la documentación aportada por la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, encontrando que se ajusta de manera íntegra con los requisitos establecidos en la Ley 2166 de 2021 y el artículo 2.3.2.2.18 del Decreto Único 1066 de 2015.`,
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
    ` Inscribir a la ${tipodocumento} ${nombreOrganizacion} del municipio de ${municipio}, Departamento de Boyacá, para el periodo comprendido entre el ${periodoInicio || '____'} y el ${periodoFin || '____'} a los siguientes dignatarios:`,
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
    const comisionesMap = {};

    datosCertificado.dignatarios.forEach(d => {
      const cargo = (d.cargo || '').trim();
      const cargoLower = cargo.toLowerCase();
      const comision = (d.comision || '').trim();
      const expedido = (d.expedidoEn || municipio || '').toUpperCase();
      const nombre = (d.nombre || '').toUpperCase();
      const cedula = (d.cedula || '').toString();

      if (comision) {
        if (!comisionesMap[comision]) {
          comisionesMap[comision] = { rows: [], col1Header: cargo ? 'CARGO' : 'COMISIÓN' };
        }
        if (!cargo) comisionesMap[comision].col1Header = 'COMISIÓN';
        comisionesMap[comision].rows.push([cargo || comision, nombre, cedula, expedido]);
      } else if (cargoLower.includes('fiscal')) {
        fiscales.push([cargo, nombre, cedula, expedido]);
      } else if (cargoLower.includes('delegado')) {
        delegados.push([cargo, nombre, cedula, expedido]);
      } else {
        directivos.push([cargo, nombre, cedula, expedido]);
      }
    });

    if (directivos.length > 0) {
      yPos = drawTable('DIRECTIVOS', 'CARGO', directivos, yPos);
    }
    if (fiscales.length > 0) {
      yPos = drawTable('FISCAL', 'CARGO', fiscales, yPos);
    }
    Object.entries(comisionesMap).forEach(([comisionName, data]) => {
      const nameUp = comisionName.toUpperCase();
      const title = nameUp.startsWith('COMISI') ? nameUp : `COMISIÓN DE ${nameUp}`;
      yPos = drawTable(title, data.col1Header, data.rows, yPos);
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

  // Parágrafo
  yPos = writePara(
    'Parágrafo: La inscripción de los mismos se realizará en el Registro Sistematizado de Información de los Organismos de Acción Comunal.',
    yPos
  );
  yPos += 5;

  // ── ARTÍCULO SEGUNDO ──
  yPos = writeArticle(
    'ARTÍCULO SEGUNDO:',
    ` El periodo de los dignatarios elegidos por la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, inicia el ${formatDateLong(periodoInicio)} al ${formatDateLong(periodoFin)}.`,
    yPos
  );

  // ── ARTÍCULO TERCERO ──
  yPos = writeArticle(
    'ARTÍCULO TERCERO:',
    ` Comunicar el presente acto administrativo al representante legal o quien haga sus veces, de la ${tipodocumento} ${nombreOrganizacion} del Municipio de ${municipio}, conforme a lo establecido en ley 1437 de 2011 articulo 70.`,
    yPos
  );

  // ── ARTÍCULO CUARTO ──
  yPos = writeArticle(
    'ARTÍCULO CUARTO:',
    ' Contra el presente Auto no proceden recursos de conformidad con el artículo 75 de la Ley 1437 de 2011.',
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

  centerText(doc, resources.nombreFirmante || 'NOMBRE FIRMANTE', yPos, 11, 'bold');
  yPos += 5;
  centerText(doc, resources.cargoFirmante || 'CARGO FIRMANTE', yPos, 10, 'normal');
  yPos += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Proyectó:________________', margenIzq, yPos);
  yPos += 5;
  doc.text('Revisó_________________', margenIzq, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text('GOBERNACIÓN DE BOYACÁ', margenIzq, yPos);

  return doc.output('arraybuffer');
};

export default generarAutoresolutorio;
