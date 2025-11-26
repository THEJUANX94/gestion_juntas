import { Comisiones } from "../model/comisionModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerComisiones = async (req, res) => {
  try {
    const comisiones = await Comisiones.findAll();
    return res.json(comisiones);
  } catch (error) {
    console.error("Error al obtener las comisiones:", error);
    logOperation("ERROR_OBTENER_COMISIONES", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener las comisiones", error: error.message });
  }
};