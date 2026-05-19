import generarAutoresolutorio from './pdfs/autoresolutorio.js';
import generarConsulta from './pdfs/consulta.js';
import generarCertificadoJAC from './pdfs/certificadoJAC.js';
import generarCertificadoDirectivos from './pdfs/certificadoDirectivos.js';

const generators = {
  autoresolutorio: generarAutoresolutorio,
  consulta: generarConsulta,
  certificadoJAC: generarCertificadoJAC,
  certificadoDirectivos: generarCertificadoDirectivos,
};

export const generatePdf = async (tipo, datos) => {
  const key = (tipo).toString();
  const gen = generators[key];
  if (!gen) throw new Error(`Tipo de PDF desconocido: ${tipo}`);
  return gen(datos);
};

export default { generatePdf };
