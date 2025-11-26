import { jsPDF } from "jspdf";
import { generateQR } from "./GenerateQR.js";
import { imageToBase64, logoPath } from './imgabse64.js';
import { getUltimaFirmaData } from "../controllers/firmasController.js";

const generarPDF = async (datosCertificado) => {
    // Configuración inicial del documento
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4' // A4: 210 x 297 mm
    });

    // --- VARIABLES DEL SISTEMA (Mapeo de datosCertificado) ---
    // Asegúrate de pasar estos datos al llamar la función
    const municipio = (datosCertificado.NombreMunicipio || "ALMEIDA").toUpperCase();
    const nombreOrganizacion = (datosCertificado.nombreOrganizacion || "ASOCIACION COMUNAL DE JUNTAS").toUpperCase();
    const personeriaNumero = datosCertificado.personeriaNumero || "____";
    const personeriaFecha = datosCertificado.personeriaFecha || "____-__-__";
    
    // Fechas de periodo
    const periodoInicio = datosCertificado.periodoInicio || "2022-07-01";
    const periodoFin = datosCertificado.periodoFin || "2026-06-30";

    // Márgenes
    const margenIzq = 25;
    const margenDer = 25;
    const anchoUtil = 210 - margenIzq - margenDer; // ~160mm
    const altoPagina = 297;
    const margenInf = 25;

    let yPos = 20; // Posición vertical inicial cursor
    let base64Logo = '';
    let base64Firma = '';
    let nombreFirmante = "OLGA LUCIA SOTO GONZALEZ"; // Default según PDF
    let cargoFirmante = "DIRECTORA DE PARTICIPACION Y ACCION COMUNAL"; // Default

    // --- CARGA DE RECURSOS (Logo y Firma) ---
    try {
        console.log("Cargando logo...");
        base64Logo = await imageToBase64(logoPath); 

        console.log("Obteniendo datos de firma...");
        const firmanteData = await getUltimaFirmaData();
        
        if (firmanteData && firmanteData.ubicacion) {
            base64Firma = await imageToBase64(firmanteData.ubicacion);
            nombreFirmante = firmanteData.nombreFirmante || nombreFirmante;
            cargoFirmante = firmanteData.cargo || cargoFirmante;
        }
    } catch (e) {
        console.error("Error cargando recursos gráficos:", e);
    }

    // --- GENERACIÓN DEL QR ---
    // Usamos el ID o el Número de Auto para validación
    const validationUrl = `https://certificacion.boyaca.gov.co/validacionqr/${datosCertificado.IDCertificado || numeroAuto}`;
    const qr = await generateQR(validationUrl);

    // --- FUNCIONES AUXILIARES ---
    
    // Función para verificar salto de página
    const checkPageBreak = (heightNeeded) => {
        if (yPos + heightNeeded > altoPagina - margenInf) {
            doc.addPage();
            yPos = 25; // Reiniciar margen superior
            return true;
        }
        return false;
    };

    // Función para centrar texto
    const centerText = (text, y, size = 10, font = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', font);
        const textWidth = doc.getTextWidth(text);
        const x = (210 - textWidth) / 2;
        doc.text(text, x, y);
    };

    // Función para justificar párrafos
    const addParagraph = (text, size = 10, font = 'normal', align = 'justify') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', font);
        const lines = doc.splitTextToSize(text, anchoUtil);
        
        checkPageBreak(lines.length * 5); // Estimar altura (5mm por línea aprox)
        
        doc.text(lines, margenIzq, yPos, { align: align, maxWidth: anchoUtil });
        yPos += (lines.length * 5) + 3; // Salto de línea después del párrafo
    };

    // ================= CONTENIDO DEL PDF =================

    // 1. ENCABEZADO
    if (base64Logo) {
        doc.addImage(base64Logo, "PNG", margenIzq, 10, 25, 25);
    }
    // Texto Gobernación al lado del logo
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
    doc.addImage(qr, "PNG", 170, 10, 25, 25);

    yPos = 50;

    const titulo1 = `POR MEDIO DE LA CUAL SE REALIZA LA INSCRIPCIÓN Y RECONOCIMIENTO DE DIGNATARIOS ELEGIDOS POR LA ${nombreOrganizacion}`;
    const linesTitulo = doc.splitTextToSize(titulo1, 140); // Más angosto para centrar mejor
    doc.text(linesTitulo, 105, yPos, { align: 'center' });
    yPos += (linesTitulo.length * 5) + 5;

    centerText(`${nombreOrganizacion} DEL MUNICIPIO DE ${municipio}`, yPos, 10, 'bold');
    yPos += 6;

    centerText(`CON PERSONERIA N° ${personeriaNumero} DE FECHA ${personeriaFecha}`, yPos, 10, 'bold');
    yPos += 10;

    centerText("LA DIRECCIÓN DE PARTICIPACIÓN Y ACCIÓN COMUNAL DE LA SECRETARIA", yPos, 9, 'bold');
    yPos += 4;
    centerText("DE GOBIERNO Y ACCIÓN COMUNAL DE LA GOBERNACIÓN DE BOYACÁ", yPos, 9, 'bold');
    yPos += 10;

    // 3. INTRODUCCIÓN LEGAL
    const introText = "En ejercicio de las facultades y competencias legales previstas en las Leyes 743 y 753 de 2002; Ley 1437 de 2011; Ley 2166 del 18 de diciembre de 2021, el Decreto Único Reglamentario N° 1066 de 2015; las Resoluciones 1513 de 22 de septiembre de 2021 y 0108 de 26 de enero de 2022, expedidas por el Ministerio del Interior y, en especial la Ordenanza 049 de 2019, emitida por la Asamblea de Boyacá y el Decreto Departamental 076 de 30 de enero de 2019 proferido por el Gobernador de Boyacá,";
    addParagraph(introText);

    yPos += 2;
    centerText("CONSIDERANDO:", yPos, 10, 'bold');
    yPos += 8;

    // 4. CONSIDERANDOS (Texto denso)
    const considerandos = [
        "Que el artículo 63 y siguientes de la Ley 743 de 2002, en concordancia con numeral 4° del artículo 2.3.2.1.25 del Decreto 1066 de 2015, los nombramientos y elección de dignatarios se inscribirá ante las entidades que ejercen su vigilancia, inspección y control, quien expedirá el respectivo acto administrativo de inscripción.",
        "Que la ordenanza No 049 de 2019, establece que la Secretaría de Gobierno y Acción Comunal está compuesta entre otras por la Dirección de Participación y Acción Comunal, la cual tiene entre otras funciones ejercer las funciones de Inspección, Control y Vigilancia de los organismos de acción comunal de primero y segundo grado que existan en el Departamento de Boyacá.",
        "Que la Resolución 1513 del 22 de septiembre de 2021, 'Por la cual se dictan disposiciones para el normal desarrollo de la elección de Dignatarios y Directivos de los Órganos de Acción Comunal' estableció en su artículo 6 el cronograma electoral.",
        "Que la Ley 743 de 2002 en su artículo 30, establece en relación al periodo de los directivos y los dignatarios, lo siguiente: 'El período de los directivos y dignatarios de los organismos de acción comunal es el mismo de las corporaciones públicas nacional y territoriales, según el caso.'",
        `Que La ${nombreOrganizacion} del Municipio de ${municipio}, realizó el proceso de elección de dignatarios de conformidad a las modalidades de elección establecidas en la ley.`,
        `Que en razón a que la elección de dignatarios de la ${nombreOrganizacion} del Municipio de ${municipio}, se llevó a cabo conforme a la normativa vigente, es oportuno aplicar la referida normativa para el estudio de los requisitos establecidos para la elección y posterior inscripción de dignatarios.`,
        "Que de conformidad con lo previsto en el artículo 18 del Decreto 890 de 2008 compilado en el artículo 2.3.2.2.18 del Decreto Único 1066 de 2015 se debe acreditar los requisitos de Acta de Asamblea, Listado de asistentes y Planchas o Listas presentadas.",
        `Con el objeto de verificar el cumplimiento de los requisitos mínimos de validez de la elección de dignatarios, la Dirección de Participación y Acción Comunal procedió con el análisis jurídico de la documentación aportada por la ${nombreOrganizacion} del Municipio de ${municipio}, encontrando que se ajusta de manera íntegra con los requisitos legales.`
    ];

    considerandos.forEach(parrafo => {
        addParagraph(parrafo);
    });

    addParagraph("Con fundamento en las anteriores consideraciones, la Dirección de Participación y Acción Comunal, en uso de sus facultades legales,");

    yPos += 5;
    centerText("RESUELVE:", yPos, 11, 'bold');
    yPos += 10;

    // 5. RESUELVE (ARTICULOS)
    
    // ARTICULO PRIMERO
    const art1Text = `ARTÍCULO PRIMERO: Inscribir a la ${nombreOrganizacion} del municipio de ${municipio}, Departamento de Boyacá, para el periodo comprendido.`;
    
    doc.setFont('helvetica', 'bold');
    doc.text("ARTÍCULO PRIMERO:", margenIzq, yPos);
    const anchoLabel = doc.getTextWidth("ARTÍCULO PRIMERO: ");
    
    doc.setFont('helvetica', 'normal');
    // Escribimos el resto del texto justificado manualmente o simple
    const splitArt1 = doc.splitTextToSize(`Inscribir a la ${nombreOrganizacion} del municipio de ${municipio}, Departamento de Boyacá.`, anchoUtil - anchoLabel);
    doc.text(splitArt1, margenIzq + anchoLabel, yPos);
    yPos += (splitArt1.length * 5) + 5;

    // TABLA DE DIGNATARIOS (Ejemplo estático o dinámico si viniera en datosCertificado.dignatarios)
    // Aquí puedes iterar si tienes un array de dignatarios
    doc.setFont('helvetica', 'bold');
    centerText(nombreOrganizacion, yPos, 9, 'bold');
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Si hay datos dinámicos, usarlos, si no, dejar espacio o mensaje
    if (datosCertificado.dignatarios && datosCertificado.dignatarios.length > 0) {
        datosCertificado.dignatarios.forEach(d => {
            checkPageBreak(6);
            doc.text(`${d.cargo}: ${d.nombre} (CC: ${d.cedula})`, margenIzq + 10, yPos);
            yPos += 5;
        });
    } else {
        doc.text("[ESPACIO PARA LISTADO DE DIGNATARIOS]", margenIzq + 10, yPos);
        yPos += 10;
    }

    doc.setFontSize(8);
    doc.text("Parágrafo: La inscripción de los mismos se realizará en el Registro Sistematizado.", margenIzq, yPos);
    yPos += 8;

    // ARTICULO SEGUNDO
    checkPageBreak(20);
    const art2Label = "ARTÍCULO SEGUNDO: ";
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(art2Label, margenIzq, yPos);
    const anchoArt2 = doc.getTextWidth(art2Label);
    
    doc.setFont('helvetica', 'normal');
    const textoArt2 = `El periodo de los dignatarios elegidos por la ${nombreOrganizacion} del Municipio de ${municipio}, inicia el ${periodoInicio} y finaliza el ${periodoFin}.`;
    const splitArt2 = doc.splitTextToSize(textoArt2, anchoUtil - anchoArt2);
    doc.text(splitArt2, margenIzq + anchoArt2, yPos);
    yPos += (splitArt2.length * 5) + 5;

    // ARTICULO TERCERO
    checkPageBreak(20);
    const art3Label = "ARTÍCULO TERCERO: ";
    doc.setFont('helvetica', 'bold');
    doc.text(art3Label, margenIzq, yPos);
    const anchoArt3 = doc.getTextWidth(art3Label);
    
    doc.setFont('helvetica', 'normal');
    const textoArt3 = `Comunicar el presente acto administrativo al representante legal de la ${nombreOrganizacion} del Municipio de ${municipio}, conforme a lo establecido en ley 1437 de 2011 artículo 70.`;
    const splitArt3 = doc.splitTextToSize(textoArt3, anchoUtil - anchoArt3);
    doc.text(splitArt3, margenIzq + anchoArt3, yPos);
    yPos += (splitArt3.length * 5) + 5;

    // ARTICULO CUARTO
    const art4Label = "ARTÍCULO CUARTO: ";
    doc.setFont('helvetica', 'bold');
    doc.text(art4Label, margenIzq, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text("Contra el presente Auto no proceden recursos de conformidad con el artículo 75 de la Ley 1437 de 2011.", margenIzq + doc.getTextWidth(art4Label), yPos, {maxWidth: anchoUtil - doc.getTextWidth(art4Label)});
    
    yPos += 15;

    // 6. CIERRE Y FIRMA
    checkPageBreak(50); // Asegurar espacio para la firma
    
    const fechaExpedicion = new Date(fechaAuto);
    const textoFecha = `Dado en Tunja, el ${fechaExpedicion.getDate()} de ${fechaExpedicion.toLocaleString('es-CO', { month: 'long' })} de ${fechaExpedicion.getFullYear()}.`;
    doc.text(textoFecha, margenIzq, yPos);
    yPos += 10;

    centerText("COMUNÍQUESE Y CÚMPLASE", yPos, 10, 'bold');
    yPos += 15;

    // Espacio Firma
    const anchoFirma = 50;
    const altoFirma = 25;
    const xFirma = (210 - anchoFirma) / 2;

    if (base64Firma) {
        doc.addImage(base64Firma, 'PNG', xFirma, yPos, anchoFirma, altoFirma);
        yPos += altoFirma + 5;
    } else {
        yPos += 30; // Espacio vacío si no carga la imagen
    }

    doc.setFont('helvetica', 'bold');
    centerText(nombreFirmante, yPos, 11, 'bold');
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    centerText(cargoFirmante, yPos, 10, 'normal');

    return doc.output('arraybuffer');
};

export default generarPDF;