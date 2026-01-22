import {
  createDoc,
  addPDFHeader,
  addPDFFooer,
  centerText,
  checkPageBreak,
  DEFAULTS,
  loadResources
} from '../pdfBase.js';

const generarAutoresolutorio = async (datosCertificado) => {
  const doc = createDoc();

  // --- MAPEO DE DATOS CON VALORES POR DEFECTO ---
  const municipio = (datosCertificado.NombreMunicipio).toUpperCase();
  const nombreOrganizacion = (datosCertificado.nombreOrganizacion).toUpperCase();
  const personeriaNumero = datosCertificado.personeriaNumero;
  const personeriaFecha = datosCertificado.personeriaFecha;
  const periodoInicio = datosCertificado.periodoInicio;
  const periodoFin = datosCertificado.periodoFin;
  const tipodocumento = datosCertificado.TipoCertificado

  const { margenIzq, margenDer, altoPagina, margenInf } = DEFAULTS;
  const anchoUtil = 210 - margenIzq - margenDer; // ~160mm

  let yPos = 50; // Posición vertical inicial (después del header con logo y QR)

  // --- CARGAR RECURSOS Y AGREGAR HEADER ---
  const resources = await addPDFHeader(doc, datosCertificado);

  // --- TÍTULO PRINCIPAL ---
  const titulo = `POR MEDIO DE LA CUAL SE REALIZA LA INSCRIPCIÓN Y RECONOCIMIENTO DE DIGNATARIOS ELEGIDOS POR LA ${tipodocumento}`;
  const linesTitulo = doc.splitTextToSize(titulo, 140);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(linesTitulo, 105, yPos, { align: 'center' });
  yPos += (linesTitulo.length * 5) + 5;

  // --- IDENTIFICACIÓN DE LA ORGANIZACIÓN ---
  centerText(doc, `${tipodocumento} DEL MUNICIPIO DE ${municipio}`, yPos, 10, 'bold');
  yPos += 6;

  centerText(doc, `CON PERSONERIA N° ${personeriaNumero} DE FECHA ${personeriaFecha}`, yPos, 10, 'bold');
  yPos += 10;

  centerText(doc, "LA DIRECCIÓN DE PARTICIPACIÓN Y ACCIÓN COMUNAL DE LA SECRETARIA", yPos, 9, 'bold');
  yPos += 4;
  centerText(doc, "DE GOBIERNO Y ACCIÓN COMUNAL DE LA GOBERNACIÓN DE BOYACÁ", yPos, 9, 'bold');
  yPos += 10;

  // --- INTRODUCCIÓN LEGAL ---
  const introText = "En ejercicio de las facultades y competencias legales previstas en las Leyes 743 y 753 de 2002; Ley 1437 de 2011; Ley 2166 del 18 de diciembre de 2021, el Decreto Único Reglamentario N° 1066 de 2015; las Resoluciones 1513 de 22 de septiembre de 2021 y 0108 de 26 de enero de 2022, expedidas por el Ministerio del Interior y, en especial la Ordenanza 049 de 2019, emitida por la Asamblea de Boyacá y el Decreto Departamental 076 de 30 de enero de 2019 proferido por el Gobernador de Boyacá,";

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const linesIntro = doc.splitTextToSize(introText, anchoUtil);

  let heightIntro = (linesIntro.length * 5) + 5;
  let result = checkPageBreak(doc, yPos, heightIntro);
  yPos = result.yPos;

  doc.text(linesIntro, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += heightIntro;

  yPos += 2;
  centerText(doc, "CONSIDERANDO:", yPos, 10, 'bold');
  yPos += 8;

  // --- CONSIDERANDOS ---
  const considerandos = [
    "Que el artículo 63 y siguientes de la Ley 743 de 2002, en concordancia con numeral 4° del artículo 2.3.2.1.25 del Decreto 1066 de 2015, los nombramientos y elección de dignatarios se inscribirá ante las entidades que ejercen su vigilancia, inspección y control, quien expedirá el respectivo acto administrativo de inscripción.",
    "Que la ordenanza No 049 de 2019, establece que la Secretaría de Gobierno y Acción Comunal está compuesta entre otras por la Dirección de Participación y Acción Comunal, la cual tiene entre otras funciones ejercer las funciones de Inspección, Control y Vigilancia de los organismos de acción comunal de primero y segundo grado que existan en el Departamento de Boyacá.",
    "Que la Resolución 1513 del 22 de septiembre de 2021, 'Por la cual se dictan disposiciones para el normal desarrollo de la elección de Dignatarios y Directivos de los Órganos de Acción Comunal' estableció en su artículo 6 el cronograma electoral.",
    "Que la Ley 743 de 2002 en su artículo 30, establece en relación al periodo de los directivos y los dignatarios, lo siguiente: 'El período de los directivos y dignatarios de los organismos de acción comunal es el mismo de las corporaciones públicas nacional y territoriales, según el caso.'",
    `Que La ${tipodocumento} del Municipio de ${municipio}, realizó el proceso de elección de dignatarios de conformidad a las modalidades de elección establecidas en la ley.`,
    `Que en razón a que la elección de dignatarios de la ${tipodocumento} del Municipio de ${municipio}, se llevó a cabo conforme a la normativa vigente, es oportuno aplicar la referida normativa para el estudio de los requisitos establecidos para la elección y posterior inscripción de dignatarios.`,
    "Que de conformidad con lo previsto en el artículo 18 del Decreto 890 de 2008 compilado en el artículo 2.3.2.2.18 del Decreto Único 1066 de 2015 se debe acreditar los requisitos de Acta de Asamblea, Listado de asistentes y Planchas o Listas presentadas.",
    `Con el objeto de verificar el cumplimiento de los requisitos mínimos de validez de la elección de dignatarios, la Dirección de Participación y Acción Comunal procedió con el análisis jurídico de la documentación aportada por la ${nombreOrganizacion} del Municipio de ${municipio}, encontrando que se ajusta de manera íntegra con los requisitos legales.`
  ];

  considerandos.forEach((considerando, idx) => {
    const lines = doc.splitTextToSize(considerando, anchoUtil);
    const heightNeeded = (lines.length * 5) + 3;

    result = checkPageBreak(doc, yPos, heightNeeded);
    yPos = result.yPos;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
    yPos += heightNeeded;
  });

  // --- Cierre de considerandos ---
  const textoIntroResuelve = "Con fundamento en las anteriores consideraciones, la Dirección de Participación y Acción Comunal, en uso de sus facultades legales,";
  const linesIntroResuelve = doc.splitTextToSize(textoIntroResuelve, anchoUtil);

  let heightIntroResuelve = (linesIntroResuelve.length * 5) + 5;
  result = checkPageBreak(doc, yPos, heightIntroResuelve);
  yPos = result.yPos;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(linesIntroResuelve, margenIzq, yPos, { align: 'justify', maxWidth: anchoUtil });
  yPos += heightIntroResuelve;

  yPos += 2;
  centerText(doc, "RESUELVE:", yPos, 11, 'bold');
  yPos += 10;

  // --- ARTÍCULOS ---

  // ARTÍCULO PRIMERO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const art1Label = "ARTÍCULO PRIMERO:";

  const textoArt1 = `Inscribir a la ${tipodocumento} del municipio de ${municipio}, Departamento de Boyacá, para el periodo comprendido.`;
  doc.setFont('helvetica', 'normal');
  const splitArt1 = doc.splitTextToSize(textoArt1, anchoUtil - 5);
  // calcular espacio necesario (incluye una línea para la etiqueta)
  let heightNeededArt1 = (splitArt1.length * 5) + 8;
  result = checkPageBreak(doc, yPos, heightNeededArt1);
  yPos = result.yPos;

  // Imprimir etiqueta en su propia línea
  doc.setFont('helvetica', 'bold');
  doc.text(art1Label, margenIzq, yPos);
  yPos += 6;

  // Imprimir texto del artículo
  doc.setFont('helvetica', 'normal');
  doc.text(splitArt1, margenIzq + 5, yPos);
  yPos += (splitArt1.length * 5) + 5;

  // Tabla de dignatarios
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  centerText(doc, tipodocumento, yPos, 9, 'bold');
  yPos += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (datosCertificado.dignatarios && datosCertificado.dignatarios.length > 0) {

    // --- PASO 1: CLASIFICACIÓN EXACTA ---
    const grupoPresidente = [];
    const rolesGenerales = {}; // Objeto para Tesorero, Fiscal, etc.
    const grupoComisiones = [];
    const grupoSuplentes = [];

    datosCertificado.dignatarios.forEach(d => {
      const cargo = (d.cargo || '').trim();
      const cargoLower = cargo.toLowerCase();
      const comision = (d.comision || '').trim();

      // 1. Prioridad: Suplentes (van al final)
      if (cargoLower.includes('suplente')) {
        grupoSuplentes.push(d);
        return; // Pasamos al siguiente
      }

      // 2. Prioridad: Presidente (va al inicio)
      if (cargoLower === 'presidente' || cargoLower === 'presidenta') {
        grupoPresidente.push(d);
        return;
      }

      // 3. Prioridad: Cargo estándar (si existe texto en cargo)
      if (cargo.length > 0) {
        if (!rolesGenerales[cargo]) {
          rolesGenerales[cargo] = [];
        }
        rolesGenerales[cargo].push(d);
        return;
      }

      // 4. Prioridad: Por Comisión (si no tiene cargo pero tiene comisión)
      if (comision.length > 0) {
        grupoComisiones.push(d);
        return;
      }
    });

    // --- PASO 2: FUNCIÓN DE DIBUJADO (Ligeramente ajustada para mostrar Comisión) ---
    const anchoRecuadro = anchoUtil - 10;
    const margenRecuadro = margenIzq + 5;

    // param: tituloGrupo -> Texto grande arriba
    // param: listaPersonas -> Array de objetos
    // param: usarCampoComision -> Booleano para saber qué campo mostrar
    const dibujarGrupo = (tituloGrupo, listaPersonas, usarCampoComision = false) => {
      if (!listaPersonas || listaPersonas.length === 0) return;

      // Verificar espacio para el TÍTULO
      result = checkPageBreak(doc, yPos, 15);
      yPos = result.yPos;

      // Dibujar TÍTULO
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 100, 0);
      doc.text(tituloGrupo.toUpperCase(), margenRecuadro, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);

      listaPersonas.forEach(d => {
        // Lógica para el texto: Si es grupo de comisiones, mostramos la comisión, si no, el cargo
        const rolAMostrar = usarCampoComision ? (d.comision || '') : (d.cargo || '');

        const textoDignatario = `${d.nombre || ''} (CC: ${d.cedula || ''}) - ${rolAMostrar}`;

        const lineas = doc.splitTextToSize(textoDignatario, anchoRecuadro - 4);
        const altoFila = (lineas.length * 4) + 4;

        // Verificar salto de página dentro de la tabla
        result = checkPageBreak(doc, yPos, altoFila + 2);
        if (result.yPos !== yPos) {
          yPos = result.yPos;
          doc.setFont('helvetica', 'bold');
          doc.text(`${tituloGrupo.toUpperCase()} (Cont.)`, margenRecuadro, yPos - 5);
          doc.setFont('helvetica', 'normal');
        } else {
          yPos = result.yPos;
        }

        doc.setDrawColor(0, 100, 0);
        doc.rect(margenRecuadro, yPos, anchoRecuadro, altoFila);
        doc.text(lineas, margenRecuadro + 2, yPos + 4);

        yPos += altoFila;
      });

      yPos += 8; // Separación entre tablas
    };

    // --- PASO 3: ORDEN DE EJECUCIÓN ---

    // 1. PRESIDENTE (Siempre primero)
    // Usamos "PRESIDENTE" como título genérico, o tomamos el cargo del primero si quieres ser específico ("PRESIDENTA")
    const tituloPresi = grupoPresidente.length > 0 ? grupoPresidente[0].cargo : 'PRESIDENTE';
    dibujarGrupo(tituloPresi, grupoPresidente);

    // 2. OTROS CARGOS (Orden alfabético o según aparezcan)
    Object.keys(rolesGenerales).forEach(cargo => {
      dibujarGrupo(cargo, rolesGenerales[cargo]);
    });

    // 3. POR COMISIÓN (Si existen comisionados sin cargo)
    // Pasamos 'true' en el tercer argumento para que muestre el campo 'comision' en vez de 'cargo'
    dibujarGrupo('POR COMISIÓN', grupoComisiones, true);

    // 4. SUPLENTES (Siempre al final)
    dibujarGrupo('SUPLENTES', grupoSuplentes);

  } else {
    doc.text('[ESPACIO PARA LISTADO DE DIGNATARIOS]', margenIzq + 10, yPos);
    yPos += 10;
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text("Parágrafo: La inscripción de los mismos se realizará en el Registro Sistematizado.", margenIzq, yPos);
  yPos += 8;

  // ARTÍCULO SEGUNDO
  doc.setFontSize(10);
  const art2Label = "ARTÍCULO SEGUNDO:";

  const textoArt2 = `El periodo de los dignatarios elegidos por la ${tipodocumento} del Municipio de ${municipio}, inicia el ${periodoInicio} y finaliza el ${periodoFin}.`;
  doc.setFont('helvetica', 'normal');
  const splitArt2 = doc.splitTextToSize(textoArt2, anchoUtil - 5);
  let heightNeededArt2 = (splitArt2.length * 5) + 8;
  result = checkPageBreak(doc, yPos, heightNeededArt2);
  yPos = result.yPos;

  doc.setFont('helvetica', 'bold');
  doc.text(art2Label, margenIzq, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(splitArt2, margenIzq + 5, yPos);
  yPos += (splitArt2.length * 5) + 5;

  // ARTÍCULO TERCERO
  const art3Label = "ARTÍCULO TERCERO:";
  const textoArt3 = `Comunicar el presente acto administrativo al representante legal de la ${tipodocumento} del Municipio de ${municipio}, conforme a lo establecido en ley 1437 de 2011 artículo 70.`;
  doc.setFont('helvetica', 'normal');
  const splitArt3 = doc.splitTextToSize(textoArt3, anchoUtil - 5);
  let heightNeededArt3 = (splitArt3.length * 5) + 8;
  result = checkPageBreak(doc, yPos, heightNeededArt3);
  yPos = result.yPos;

  doc.setFont('helvetica', 'bold');
  doc.text(art3Label, margenIzq, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(splitArt3, margenIzq + 5, yPos);
  yPos += (splitArt3.length * 5) + 5;

  // ARTÍCULO CUARTO
  const art4Label = "ARTÍCULO CUARTO:";
  const textoArt4 = "Contra el presente Auto no proceden recursos de conformidad con el artículo 75 de la Ley 1437 de 2011.";
  doc.setFont('helvetica', 'normal');
  const splitArt4 = doc.splitTextToSize(textoArt4, anchoUtil - 5);
  let heightNeededArt4 = (splitArt4.length * 5) + 8;
  result = checkPageBreak(doc, yPos, heightNeededArt4);
  yPos = result.yPos;

  doc.setFont('helvetica', 'bold');
  doc.text(art4Label, margenIzq, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(splitArt4, margenIzq + 5, yPos);
  yPos += (splitArt4.length * 5) + 8;

  // --- FIRMA AL FINAL (Posición reservada) ---
  // Dejar espacio suficiente y luego agregar firma al final de la página
  addPDFFooer(
    doc,
    resources.nombreFirmante,
    resources.cargoFirmante,
    resources.base64Firma,
    altoPagina - margenInf - 40 // Posición fija cerca del final
  );

  return doc.output('arraybuffer');
};

export default generarAutoresolutorio;
