import {
  createDoc,
  addPDFHeader,
  addPDFFooer,
  centerText,
  checkPageBreak,
  DEFAULTS
} from '../pdfBase.js';

const buscarDignatarioPorCargo = (dignatarios, cargoBuscado) => {
  if (!dignatarios || !Array.isArray(dignatarios)) return null;
  return dignatarios.find(d => 
    d.cargo && d.cargo.toUpperCase().includes(cargoBuscado.toUpperCase())
  ) || null;
};

const generarResolucionJAC = async (datosCertificado) => {
  const doc = createDoc();

  const presidente = buscarDignatarioPorCargo(datosCertificado.dignatarios, 'PRESIDENTE');

  const municipio = (datosCertificado.NombreMunicipio || "").toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion || "").toUpperCase();
  const tipoOrganismo = (datosCertificado.TipoCertificado || "").toUpperCase();
  
  // Datos del Presidente
  const nombrePresidente = (presidente?.nombre || "REPRESENTANTE LEGAL").toString().toUpperCase();
  const cedulaPresidente = (presidente?.cedula || "__________").toString();
  
  // Configuración de Fechas y Año
  const anioResolucion = "2026";
  
  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer;
  
  let yPos = 50;

  // --- HEADER Y LOGOS ---
  const resources = await addPDFHeader(doc, datosCertificado);

  // --- TÍTULO DE LA RESOLUCIÓN ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  centerText(doc, `RESOLUCIÓN NÚMERO _____________ DE ${anioResolucion}`, yPos);
  yPos += 6;
  
  centerText(doc, "(_______________________)", yPos);
  yPos += 10;

  // Objeto de la Resolución
  const tituloObjeto = `POR LA CUAL SE RECONOCE PERSONERÍA JURÍDICA A LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio} DEPARTAMENTO DE BOYACÁ`;
  const linesTitulo = doc.splitTextToSize(tituloObjeto, anchoUtil);
  
  linesTitulo.forEach(line => {
    centerText(doc, line, yPos);
    yPos += 5;
  });
  yPos += 8;

  // --- AUTORIDAD COMPETENTE ---
  centerText(doc, "EL DIRECTOR DE PARTICIPACIÓN Y ACCIÓN COMUNAL", yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textoFacultades = "En uso de sus facultades legales y en especial las que confiere la Ley 52 de 1990, Ley 2166 de 18 de diciembre de 2021, Decreto 1501 del 13 de septiembre de 2023, Decreto 1066 del 26 de mayo de 2015, Decreto Departamental 076 de 30 de enero de 2019 y";
  
  const linesFacultades = doc.splitTextToSize(textoFacultades, anchoUtil);
  doc.text(linesFacultades, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += (linesFacultades.length * 5) + 8;

  // --- CONSIDERANDOS ---
  doc.setFont('helvetica', 'bold');
  centerText(doc, "CONSIDERANDO:", yPos, 10, 'bold');
  yPos += 8;
  doc.setFont('helvetica', 'normal');

  // Determinar género para el texto
  const genero = nombrePresidente.includes("SEÑORA") || nombrePresidente.startsWith("MARIA") || 
                 nombrePresidente.startsWith("ANA") ? "la señora" : "el señor";
  const identificado = genero === "la señora" ? "identificada" : "identificado";

  const txtConsiderando1 = `Que ${genero} ${nombrePresidente}, ${identificado} con cédula de ciudadanía No. ${cedulaPresidente} de ${municipio}, en calidad de PRESIDENTE DE LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ solicitó a esta Dependencia se le reconozca PERSONERÍA JURÍDICA, comprometiéndose a cumplir con todas las normas vigentes que reglamentan a los Organismos Comunales.`;

  const txtConsiderando2 = "Que igualmente anexa a esta solicitud Acta No.01 de constitución y aprobación de estatutos y Acta No. 02 de elección de Dignatarios;";
  
  const txtConsiderando3 = `Listado de afiliados y Certificación del Secretario de Planeación del Municipio de ${municipio} Boyacá.`;

  const txtConsiderando4 = "Que estudiada la documentación se encontró acorde con lo preceptuado en la Ley 52 del 28 de Diciembre de 1990, 2166 de 18 de diciembre de 2021, Decreto 1501 del 13 de septiembre de 2023, Decreto 1066 del 26 de mayo de 2015 y demás normas vigentes que reglamentan a las Organizaciones Comunales.";

  const txtConsiderando5 = "Que en mérito de lo expuesto, el Director de Participación y Acción Comunal de la Secretaría de Gobierno y Acción Comunal de la Gobernación de Boyacá,";

  const considerandos = [txtConsiderando1, txtConsiderando2, txtConsiderando3, txtConsiderando4, txtConsiderando5];

  considerandos.forEach((texto) => {
    const lines = doc.splitTextToSize(texto, anchoUtil);
    let result = checkPageBreak(doc, yPos, (lines.length * 5) + 6);
    yPos = result.yPos;
    doc.text(lines, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
    yPos += (lines.length * 5) + 6;
  });

  // --- PARTE RESOLUTIVA ---
  doc.setFont('helvetica', 'bold');
  centerText(doc, "RESUELVE:", yPos, 10, 'bold');
  yPos += 8;

  // Artículos
  const articulos = [
    {
      titulo: "ARTÍCULO .-",
      cuerpo: `Reconocer PERSONERÍA JURÍDICA A LA ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ.`
    },
    {
      titulo: "ARTÍCULO .-",
      cuerpo: `Inscribir los Estatutos de la ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ.`
    },
    {
      titulo: "ARTÍCULO .-",
      cuerpo: "Efectuar la inscripción de dicha PERSONERÍA JURÍDICA en los libros que para este fin se llevan en la Dirección de Participación y Acción Comunal de la Secretaría de Gobierno y Acción Comunal de la Gobernación de Boyacá."
    },
    {
      titulo: "ARTÍCULO .-",
      cuerpo: `Registrar como Representante Legal de la ${tipoOrganismo} ${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}, DEPARTAMENTO DE BOYACÁ, a ${genero} ${nombrePresidente}, ${identificado} con cédula de ciudadanía No. ${cedulaPresidente} de ${municipio}, Presidente de la misma.`
    },
    {
      titulo: "ARTÍCULO .-",
      cuerpo: "La presente Resolución rige a partir de la fecha de su expedición."
    }
  ];

  articulos.forEach((art) => {
    // Calcular altura del bloque completo
    const textoCompleto = `${art.titulo} ${art.cuerpo}`;
    const linesCompleto = doc.splitTextToSize(textoCompleto, anchoUtil);
    const alturaBloque = (linesCompleto.length * 5) + 6;
    
    // Verificar salto de página
    let result = checkPageBreak(doc, yPos, alturaBloque);
    yPos = result.yPos;

    // SOLUCIÓN AL PROBLEMA DE SUPERPOSICIÓN:
    // 1. Primero dibujamos el texto completo en normal
    doc.setFont('helvetica', 'normal');
    doc.text(linesCompleto, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
    
    // 2. Luego dibujamos SOLO el título en negrita ENCIMA
    doc.setFont('helvetica', 'bold');
    doc.text(art.titulo, margenIzq, yPos);
    
    // Avanzar posición
    yPos += (linesCompleto.length * 5) + 6;
  });

  // --- NOTIFICACIÓN Y FIRMA ---
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  centerText(doc, "NOTIFÍQUESE Y CÚMPLASE", yPos, 10, 'bold');
  yPos += 10;
  
  // Agregar ciudad y fecha
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const textoFecha = "Dada en Tunja, a los _____ días del mes de _________ de 2026";
  centerText(doc, textoFecha, yPos);
  yPos += 15;

  addPDFFooer(
    doc,
    resources.nombreFirmante,
    resources.cargoFirmante,
    resources.base64Firma,
    yPos
  );
  
  // CRÍTICO: Retornar el buffer del PDF
  return doc.output('arraybuffer');
};

export default generarResolucionJAC;