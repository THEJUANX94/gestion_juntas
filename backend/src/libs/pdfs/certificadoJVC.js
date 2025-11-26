import {
  createDoc,
  addPDFHeader,
  addPDFFooer, // Nota: Mantengo el nombre tal cual está en tu import (Fooer)
  centerText,
  checkPageBreak,
  DEFAULTS,
  loadResources
} from '../pdfBase.js';

const generarCertificadoJAC = async (datosCertificado) => {
  const doc = createDoc();

  // --- MAPEO DE DATOS CON VALORES POR DEFECTO ---
  // Extraemos datos basándonos en el contenido de JAC.pdf [cite: 6, 7]
  const municipio = (datosCertificado.NombreMunicipio).toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion).toUpperCase();
  const personeriaNumero = datosCertificado.personeriaNumero;
  const personeriaFecha = datosCertificado.personeriaFecha;
  const entidadExpidePersoneria = datosCertificado.entidadExpide;
  const tipodocumento = datosCertificado.TipoCertificado
  
  // Datos de fechas y validez [cite: 9, 11]
  const fechaVencimiento = datosCertificado.periodoFin || "2026-06-30";
  const fechaActual = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const ciudadExpedicion = "Tunja";

  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer; 

  let yPos = 50; // Posición vertical inicial

  // --- CARGAR RECURSOS Y AGREGAR HEADER ---
  // Se asume que usa el mismo header institucional [cite: 1, 2, 3]
  const resources = await addPDFHeader(doc, datosCertificado);

  // --- PREÁMBULO LEGAL ---
  // Texto extraído de [cite: 4]
  const preambulo = "El(A) Director(a) de Participación y Accion Comunal en uso de sus facultades legales y en especial las que le confiere la ley 52 de 1990, la ley 2166 del 18 de diciembre de 2021 y el Decreto 1066 del 2015 y Decreto Departamental 076 de 30 de Enero de 2019.";
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const linesPreambulo = doc.splitTextToSize(preambulo, anchoUtil);
  
  // Verificación de salto de página
  let result = checkPageBreak(doc, yPos, (linesPreambulo.length * 5) + 5);
  yPos = result.yPos;
  
  doc.text(linesPreambulo, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += (linesPreambulo.length * 5) + 10;

  // --- TÍTULO ---
  // [cite: 5]
  centerText(doc, "CERTIFICA:", yPos, 12, 'bold');
  yPos += 10;

  // --- CUERPO DE LA CERTIFICACIÓN ---
  // Texto extraído de [cite: 6]
  const textoCertifica = `Que la ${tipodocumento} del municipio de ${municipio}, Departamento de Boyacá, cuenta con Personería Juridica otorgada mediante resolución No.${personeriaNumero} de fecha ${personeriaFecha}, expedida por ${entidadExpidePersoneria}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const linesCertifica = doc.splitTextToSize(textoCertifica, anchoUtil);
  
  result = checkPageBreak(doc, yPos, (linesCertifica.length * 5) + 5);
  yPos = result.yPos;

  doc.text(linesCertifica, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += (linesCertifica.length * 5) + 10;

  // --- TABLA DE DIGNATARIOS ---
  // Replicando la estructura de tabla de [cite: 7] pero iterando como en tu ejemplo
  
  // Encabezados de tabla simulada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  
  // Definición de columnas (X coordinates)
  const colCargo = margenIzq;
  const colNombre = margenIzq + 50;
  const colDoc = margenIzq + 110;
  const colExp = margenIzq + 140;

  // Dibujar encabezados
  result = checkPageBreak(doc, yPos, 10);
  yPos = result.yPos;
  
  doc.text("CARGO", colCargo, yPos);
  doc.text("NOMBRE Y APELLIDO", colNombre, yPos);
  doc.text("DOCUMENTO", colDoc, yPos);
  doc.text("EXPEDIDO EN", colExp, yPos);
  
  yPos += 2;
  doc.line(margenIzq, yPos, 210 - margenDer, yPos); // Línea separadora
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Iteración de datos (Dignatarios) [cite: 7, 8]
  if (datosCertificado.dignatarios && datosCertificado.dignatarios.length > 0) {
    datosCertificado.dignatarios.forEach(d => {
      // Calculamos altura necesaria (el nombre o cargo pueden ser largos)
      const cargoLines = doc.splitTextToSize(d.cargo || '', 45);
      const nombreLines = doc.splitTextToSize(d.nombre || '', 55);
      const alturaFila = Math.max(cargoLines.length, nombreLines.length) * 5;

      result = checkPageBreak(doc, yPos, alturaFila + 2);
      yPos = result.yPos;

      doc.text(cargoLines, colCargo, yPos);
      doc.text(nombreLines, colNombre, yPos);
      doc.text(d.cedula || '', colDoc, yPos); // Mapeado de "DOCUMENTO"
      doc.text(d.expedidoEn || '', colExp, yPos); // Mapeado de "EXPEDIDO EN"

      yPos += alturaFila + 2;
    });
  } else {
    doc.text('[SIN REGISTRO DE DIGNATARIOS ACTIVOS]', margenIzq, yPos);
    yPos += 10;
  }
  
  yPos += 5;

  // --- CIERRE DEL TEXTO ---
  // Textos finales extraídos de [cite: 8, 9, 10, 11]
  const parrafosFinales = [
    "Que fueron inscritos como dignatarios de dicha organización:",
    `Que el periodo de los actuales dignatarios vence ${fechaVencimiento}`,
    "Esta constancia es valida por el termino de 6 (seis) meses.",
    "Se expide con el fin de adelantar tramites de la junta."
  ];

  doc.setFontSize(10);
  
  parrafosFinales.forEach(parrafo => {
    const lines = doc.splitTextToSize(parrafo, anchoUtil);
    result = checkPageBreak(doc, yPos, (lines.length * 5) + 3);
    yPos = result.yPos;
    doc.text(lines, margenIzq, yPos);
    yPos += (lines.length * 5) + 2;
  });

  yPos += 5;
  
  // Fecha y Lugar [cite: 11]
  const textoFecha = `Dada en ${ciudadExpedicion} el dia: ${datosCertificado.fechaExpedicion || fechaActual}`;
  result = checkPageBreak(doc, yPos, 10);
  yPos = result.yPos;
  doc.text(textoFecha, margenIzq, yPos);
  yPos += 10;

  // --- FIRMA (Footer principal) ---
  // [cite: 12]
  addPDFFooer(
    doc,
    resources.nombreFirmante || "OLGA LUCIA SOTO GONZALEZ",
    resources.cargoFirmante || "DIRECTORA DE PARTICIPACION Y ACCION COMUNAL",
    resources.base64Firma,
    altoPagina - margenInf - 40
  );

  // --- METADATA DE ELABORACIÓN (Pie de página inferior) ---
  // Replica la sección inferior izquierda del PDF [cite: 13, 14, 15, 16]
  const yMeta = altoPagina - margenInf + 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  const usuarioElaboro = datosCertificado.usuarioElaboro || "SISTEMA";
  const fechaHora = new Date();
  
  doc.text(`Realizó: SISTEMA`, margenIzq, yMeta);
  doc.text(`Elaboro: ${usuarioElaboro}`, margenIzq, yMeta + 3);
  doc.text(`Fecha: ${fechaHora.toLocaleDateString('es-CO')}`, margenIzq, yMeta + 6);
  doc.text(`Hora: ${fechaHora.toLocaleTimeString('es-CO')}`, margenIzq, yMeta + 9);
  
  // Footer Institucional extra [cite: 17]
  centerText(doc, "GOBERNACIÓN DE BOYACÁ", yMeta + 15, 8, 'bold');

  return doc.output('arraybuffer');
};

export default generarCertificadoJAC;