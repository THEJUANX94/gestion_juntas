import {
  createDoc,
  addPDFHeader,
  addPDFFooer,
  centerText,
  checkPageBreak,
  DEFAULTS
} from '../pdfBase.js';

const generarResolucionJAC = async (datosCertificado) => {
  const doc = createDoc();

  // --- 1. PREPARACIÓN DE VARIABLES ---
  const municipio = (datosCertificado.NombreMunicipio).toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion).toUpperCase();
  const tipoOrganismo = (datosCertificado.tipoOrganismo).toUpperCase();
  
  // Datos del Presidente (Nuevos campos requeridos) 
  const nombrePresidente = (datosCertificado.nombrePresidente).toUpperCase();
  const cedulaPresidente = datosCertificado.cedulaPresidente;
  
  // Configuración de Fechas y Año
  const anioResolucion = "2026";
  const ciudadExpedicion = "Tunja";
  
  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;
  
  let yPos = 50; // Posición inicial tras el header

  // --- 2. HEADER Y LOGOS ---
  const resources = await addPDFHeader(doc, datosCertificado);

  // --- 3. TÍTULO DE LA RESOLUCIÓN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  centerText(doc, `RESOLUCIÓN NÚMERO                      DE ${anioResolucion}`, yPos);
  yPos += 6;
  
  centerText(doc, "(                                               )", yPos);
  yPos += 10;

  // Objeto de la Resolución [cite: 6]
  const tituloObjeto = `POR LA CUAL SE RECONOCE PERSONERÍA JURÍDICA A LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio} DEPARTAMENTO DE BOYACÁ`;
  const linesTitulo = doc.splitTextToSize(tituloObjeto, anchoUtil);
  
  linesTitulo.forEach(line => {
    centerText(doc, line, yPos);
    yPos += 5;
  });
  yPos += 5;

  // --- 4. AUTORIDAD COMPETENTE ---
  // [cite: 7, 8]
  centerText(doc, "EL DIRECTOR DE PARTICIPACIÓN Y ACCIÓN COMUNAL", yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textoFacultades = "En uso de sus facultades legales y en especial las que confiere la Ley 52 de 1990, Ley 2166 de 18 de diciembre de 2021, Decreto 1501 del 13 de septiembre de 2023, Decreto 1066 del 26 de mayo de 2015, Decreto Departamental 076 de 30 de enero de 2019 y";
  
  const linesFacultades = doc.splitTextToSize(textoFacultades, anchoUtil);
  doc.text(linesFacultades, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += (linesFacultades.length * 5) + 5;

  // --- 5. CONSIDERANDOS (CONSIDERANDO) ---
  // [cite: 9]
  centerText(doc, "CONSIDERANDO:", yPos, 10, 'bold');
  yPos += 8;
  doc.setFont('helvetica', 'normal');

  // Párrafo 1: Solicitud del Presidente
  const txtConsiderando1 = `Que la señora ${nombrePresidente}, identificada con cédula de ciudadanía No. ${cedulaPresidente} de ${municipio}, en calidad de PRESIDENTE DE LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ solicitó a esta Dependencia se le reconozca PERSONERÍA JURÍDICA, comprometiéndose a cumplir con todas las normas vigentes que reglamentan a los Organismos Comunales.`;

  // Párrafo 2: Anexos [cite: 11]
  const txtConsiderando2 = "Que igualmente anexa a esta solicitud Acta No.01 de fecha 29 de septiembre de 2024 de constitución y aprobación de estatutos y Acta No. 02 de fecha 31 de octubre de 2024 de elección de Dignatarios;";
  
  // Párrafo 3: Listados [cite: 12]
  const txtConsiderando3 = "Listado de afiliados y Certificación del Secretario de Planeación del Municipio de Santana Boyacá.";

  // Párrafo 4: Estudio Jurídico [cite: 13]
  const txtConsiderando4 = "Que estudiada la documentación se encontró acorde con lo preceptuado en la Ley 52 del 28 de Diciembre de 1990, 2166 de 18 de diciembre de 2021, Decreto 1501 del 13 de septiembre de 2023, Decreto 1066 del 26 de mayo de 2015 y demás normas vigentes que reglamentan a las Organizaciones Comunales.";

  // Párrafo 5: Mérito [cite: 14]
  const txtConsiderando5 = "Que en mérito de lo expuesto, el Director de Participación y Acción Comunal de la Secretaría de Gobierno y Acción Comunal de la Gobernación de Boyacá,";

  const considerandos = [txtConsiderando1, txtConsiderando2, txtConsiderando3, txtConsiderando4, txtConsiderando5];

  considerandos.forEach((texto) => {
    const lines = doc.splitTextToSize(texto, anchoUtil);
    let result = checkPageBreak(doc, yPos, (lines.length * 5) + 5);
    yPos = result.yPos;
    doc.text(lines, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
    yPos += (lines.length * 5) + 5;
  });

  // --- 6. PARTE RESOLUTIVA (RESUELVE) ---
  centerText(doc, "RESUELVE:", yPos, 10, 'bold');
  yPos += 8;

  // Artículos [cite: 16, 17, 18, 19, 20]
  const articulos = [
    {
      titulo: "ARTÍCULO PRIMERO.-",
      cuerpo: `Reconocer PERSONERÍA JURÍDICA A LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ`
    },
    {
      titulo: "ARTICULO SEGUNDO.-",
      cuerpo: `Inscribir los Estatutos de la ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ.`
    },
    {
      titulo: "ARTÍCULO TERCERO.-",
      cuerpo: "Efectuar la inscripción de dicha PERSONERÍA JURÍDICA en los libros que para este fin se llevan en la Dirección de Participación y Acción Comunal de la Secretaría de Gobierno y Acción Comunal de la Gobernación de Boyacá."
    },
    {
      titulo: "ARTICULO CUARTO.-", // Aquí va el Representante Legal (Presidente) [cite: 19]
      cuerpo: `Registrar como Representante Legal de la ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ, a la señora ${nombrePresidente}, identificada con cédula de ciudadanía No. ${cedulaPresidente} de ${municipio}, Presidente de la misma.`
    },
    {
      titulo: "ARTÍCULO QUINTO.-",
      cuerpo: "La presente Resolución rige a partir de la fecha de su expedición."
    }
  ];

  articulos.forEach((art) => {
    doc.setFont('helvetica', 'bold');
    const titleWidth = doc.getTextWidth(art.titulo);
    
    // Verificamos si todo el bloque cabe, si no, salto de página
    const cuerpoLines = doc.splitTextToSize(art.cuerpo, anchoUtil);
    const alturaBloque = (cuerpoLines.length * 5) + 5;
    
    let result = checkPageBreak(doc, yPos, alturaBloque);
    yPos = result.yPos;

    // Dibujamos título en Negrita
    doc.text(art.titulo, margenIzq, yPos);
    
    // Dibujamos cuerpo en Normal, a continuación del título (o debajo si es muy largo, pero usualmente sigue)
    doc.setFont('helvetica', 'normal');
    // Para que quede seguido: "ARTICULO X.- Texto..."
    // Calculamos dónde empieza el texto normal
    const indent = margenIzq + titleWidth + 2; 
    
    
    // Simplificación para visualización limpia: Título y texto seguido.
    const textoCompleto = `${art.titulo}  ${art.cuerpo}`;
    const linesCompleto = doc.splitTextToSize(textoCompleto, anchoUtil);
    
    doc.text(linesCompleto, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
    
    // Re-dibujamos solo el título en Bold encima para que resalte
    doc.setFont('helvetica', 'bold');
    doc.text(art.titulo, margenIzq, yPos);
    
    yPos += (linesCompleto.length * 5) + 5;
  });

  // --- 7. NOTIFICACIÓN Y FIRMA ---
  // [cite: 21]
  yPos += 5;
  centerText(doc, "NOTIFIQUESE Y CUMPLASE", yPos, 10, 'bold');
  yPos += 15;

  addPDFFooer(
    doc,
    resources.nombreFirmante,
    resources.cargoFirmante,
    resources.base64Firma,
    yPos
  );
};

export default generarResolucionJAC;