import {
  createDoc,
  addPDFHeader,
  addPDFFooer,
  centerText,
  DEFAULTS,
  loadResources
} from '../pdfBase.js';

const generarCertificadoJVC = async (datosCertificado) => {
  const doc = createDoc();

  // Cargar recursos y agregar header (con logo, QR arriba)
  const resources = await addPDFHeader(doc, datosCertificado);

  let yPos = 50;
  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;

  // Contenido placeholder (estructura mínima lista para desarrollar)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  centerText(doc, 'CERTIFICADO JVC', yPos, 12, 'bold');
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Este es un template mínimo para el certificado JVC.', margenIzq, yPos);
  yPos += 8;

  doc.text('Ajustar contenido y estructura según requerimientos específicos.', margenIzq, yPos);
  yPos += 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Este certificado será completado en futuras iteraciones.', margenIzq, yPos, { maxWidth: anchoUtil });

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

export default generarCertificadoJVC;
