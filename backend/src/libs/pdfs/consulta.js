import {
  createDoc,
  addPDFHeader,
  addPDFFooer,
  centerText,
  DEFAULTS,
  loadResources
} from '../pdfBase.js';

const generarConsulta = async (datosCertificado) => {
  const doc = createDoc();

  // Cargar recursos y agregar header (con logo, QR arriba)
  const resources = await addPDFHeader(doc, datosCertificado);

  let yPos = 50;
  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;

  // Contenido placeholder (estructura mínima)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  centerText(doc, 'CONSULTA DE CERTIFICADO', yPos, 12, 'bold');
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Este es un template mínimo para la consulta de certificado.', margenIzq, yPos);
  yPos += 8;

  doc.text('Ajustar contenido según requerimientos específicos.', margenIzq, yPos);
  yPos += 15;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Datos enviados:', margenIzq, yPos, { maxWidth: anchoUtil });
  yPos += 6;

  const payloadText = JSON.stringify(datosCertificado || {}, null, 2);
  const lines = doc.splitTextToSize(payloadText, anchoUtil);
  doc.text(lines, margenIzq, yPos, { maxWidth: anchoUtil });

  // Firma al final
  addPDFFooer(
    doc,
    resources.nombreFirmante,
    resources.cargoFirmante,
    resources.base64Firma,
    altoPagina - margenInf - 40
  );

  return doc.output('arraybuffer');
};

export default generarConsulta;
