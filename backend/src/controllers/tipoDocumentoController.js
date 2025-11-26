import { TipoDocumento } from "../model/tipoDocumentoModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerTipoDocumento = async (req, res) => {
  try {
    const tipos = await TipoDocumento.findAll();
    return res.json(tipos);
  } catch (error) {
    console.error("Error al obtener tipos de documento:", error);
    logOperation("ERROR_OBTENER_TIPOS_DOCUMENTO", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener tipos de documento", error: error.message });
  }
};