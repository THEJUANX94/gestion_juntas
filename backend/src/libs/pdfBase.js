import { jsPDF } from "jspdf";
import { generateQR } from "./GenerateQR.js";
import { imageToBase64, logoPath } from './imgabse64.js';
import { getUltimaFirmaData } from "../controllers/firmasController.js";

// --- CONSTANTES Y CONFIGURACIÓN ---
export const DEFAULTS = {
  margenIzq: 25,
  margenDer: 25,
  anchoPagina: 210,
  altoPagina: 297,
  margenInf: 25,
};

// --- CREAR DOCUMENTO ---
export const createDoc = (options = {}) => {
  return new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    ...options
  });
};

// --- CARGAR RECURSOS (Logo y Firma) ---
export const loadResources = async () => {
  let base64Logo = '';
  let base64Firma = '';
  let nombreFirmante = "OLGA LUCIA SOTO GONZALEZ";
  let cargoFirmante = "DIRECTORA DE PARTICIPACION Y ACCION COMUNAL";

  try {
    console.log("Cargando logo...");
    base64Logo = await imageToBase64(logoPath);
  } catch (e) {
    console.warn('No se pudo cargar logo:', e.message);
  }

  try {
    console.log("Obteniendo datos de firma...");
    const firmanteData = await getUltimaFirmaData();
    if (firmanteData && firmanteData.ubicacion) {
      base64Firma = await imageToBase64(firmanteData.ubicacion);
      nombreFirmante = firmanteData.nombreFirmante || nombreFirmante;
      cargoFirmante = firmanteData.cargo || cargoFirmante;
    }
  } catch (e) {
    console.warn('No se pudo cargar firma:', e.message);
  }

  return { base64Logo, base64Firma, nombreFirmante, cargoFirmante };
};

// --- GENERAR QR ---
export const makeQR = async (datosCertificado) => {
  try {
    const validationUrl = `https://gestionjuntas.boyaca.gov.co/validacionqr/${datosCertificado.IDCertificado || ''}`;
    return await generateQR(validationUrl);
  } catch (e) {
    console.warn('No se pudo generar QR:', e.message);
    return null;
  }
};

// --- FUNCIONES AUXILIARES PARA LAYOUT ---

// Verificar si es necesario salto de página
export const checkPageBreak = (doc, yPos, heightNeeded) => {
  const { altoPagina, margenInf } = DEFAULTS;
  if (yPos + heightNeeded > altoPagina - margenInf) {
    doc.addPage();
    return { newPage: true, yPos: 25 };
  }
  return { newPage: false, yPos };
};

// Centrar texto horizontalmente
export const centerText = (doc, text, y, size = 10, font = 'normal') => {
  doc.setFontSize(size);
  doc.setFont('helvetica', font);
  const textWidth = doc.getTextWidth(text);
  const x = (DEFAULTS.anchoPagina - textWidth) / 2;
  doc.text(text, x, y);
};

// Agregar párrafo justificado con saltos de página automáticos
export const addParagraph = (doc, text, size = 10, font = 'normal', align = 'justify') => {
  const { margenIzq, margenInf, altoPagina } = DEFAULTS;
  const anchoUtil = DEFAULTS.anchoPagina - margenIzq - DEFAULTS.margenDer;

  doc.setFontSize(size);
  doc.setFont('helvetica', font);
  const lines = doc.splitTextToSize(text, anchoUtil);

  let yPos = arguments[5] || 50; // Posición Y puede pasarse como argumento

  lines.forEach((line, idx) => {
    if (yPos + 5 > altoPagina - margenInf) {
      doc.addPage();
      yPos = 25;
    }
    doc.text(line, margenIzq, yPos, { align, maxWidth: anchoUtil });
    yPos += 5;
  });

  return yPos;
};

// --- HEADER COMÚN (Logo, Gobernación, QR) ---
export const addPDFHeader = async (doc, datosCertificado) => {
  const resources = await loadResources();
  const { margenIzq } = DEFAULTS;

  // Logo
  if (resources.base64Logo) {
    doc.addImage(resources.base64Logo, "PNG", margenIzq, 10, 25, 25);
  }

  // Texto Gobernación
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text("GOBERNACIÓN DE", margenIzq + 30, 18);

  doc.setFontSize(14);
  doc.text("Boyacá", margenIzq + 30, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text("Secretaría de Gobierno y", margenIzq + 30, 30);
  doc.text("Acción Comunal", margenIzq + 30, 34);

  // QR a la derecha
  try {
    const qr = await makeQR(datosCertificado);
    if (qr) {
      doc.addImage(qr, "PNG", 170, 10, 25, 25);
    }
  } catch (e) {
    console.warn('Error al agregar QR al header:', e.message);
  }

  return resources; // Retorna recursos para reutilizarlos (especialmente firma)
};

// --- FOOTER CON FIRMA (Posicionado al final) ---
export const addPDFFooer = (doc, nombreFirmante, cargoFirmante, base64Firma = null, yPos = null) => {
  const { margenInf, altoPagina } = DEFAULTS;

  // Si no se especifica yPos, colocar cerca del final
  if (!yPos) {
    yPos = altoPagina - margenInf - 40;
  }

  // Fecha
  const fechaHoy = new Date();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const textoFecha = `Dado en Tunja, el ${fechaHoy.getDate()} de ${meses[fechaHoy.getMonth()]} de ${fechaHoy.getFullYear()}.`;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(textoFecha, DEFAULTS.margenIzq, yPos);

  yPos += 10;

  // "COMUNÍQUESE Y CÚMPLASE"
  centerText(doc, "COMUNÍQUESE Y CÚMPLASE", yPos, 10, 'bold');

  yPos += 15;

  // Firma (imagen)
  const anchoFirma = 50;
  const altoFirma = 25;
  const xFirma = (DEFAULTS.anchoPagina - anchoFirma) / 2;

  if (base64Firma) {
    doc.addImage(base64Firma, 'PNG', xFirma, yPos, anchoFirma, altoFirma);
    yPos += altoFirma + 5;
  } else {
    yPos += 30;
  }

  // Nombre y cargo del firmante
  doc.setFont('helvetica', 'bold');
  centerText(doc, nombreFirmante || 'NOMBRE FIRMANTE', yPos, 11, 'bold');
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  centerText(doc, cargoFirmante || 'CARGO FIRMANTE', yPos, 10, 'normal');
};
