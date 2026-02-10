import { TipoJunta } from "../model/tipoJuntaModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerTiposJunta = async (req, res) => {
  try {
    const tipos = await TipoJunta.findAll();
    return res.json(tipos);
  } catch (error) {
    console.error("Error al obtener tipos de junta:", error);
    logOperation("ERROR_OBTENER_TIPOS_JUNTA", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener tipos de junta", error: error.message });
  }
};

export const obtenerTipoJuntaPorId = async (req, res) => {
  try {
    const { idtipojunta } = req.params;
    if (!idtipojunta) return res.status(400).json({ message: "ID no proporcionado" });

    const tipo = await TipoJunta.findByPk(idtipojunta);
    if (!tipo) return res.status(404).json({ message: "Tipo de junta no encontrado" });

    return res.json(tipo);
  } catch (error) {
    console.error("Error al obtener tipo de junta:", error);
    logOperation("ERROR_OBTENER_TIPO_JUNTA_POR_ID", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener tipo de junta", error: error.message });
  }
};

export const crearTipoJunta = async (req, res) => {
  try {
    const { NombreTipoJunta } = req.body;
    if (!NombreTipoJunta)
      return res.status(400).json({ message: "NombreTipoJunta es requerido" });

    const nuevo = await TipoJunta.create({ NombreTipoJunta });

    logOperation("TIPO_JUNTA_CREADO", req.user || {}, { TipoJunta: nuevo.TipoJunta }, "info");

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear tipo de junta:", error);
    logOperation("ERROR_CREAR_TIPO_JUNTA", req.user || {}, { error: error.message, body: req.body }, "error");
    return res.status(500).json({ message: "Error al crear tipo de junta", error: error.message });
  }
};

export const actualizarTipoJunta = async (req, res) => {
  try {
    const { idtipojunta } = req.params;
    const id = idtipojunta;
    const { NombreTipoJunta } = req.body;

    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const tipo = await TipoJunta.findByPk(id);
    if (!tipo) return res.status(404).json({ message: "Tipo de junta no encontrado" });

    const actualizado = await tipo.update({ NombreTipoJunta });

    logOperation("TIPO_JUNTA_ACTUALIZADO", req.user || {}, { TipoJunta: id }, "info");

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar tipo de junta:", error);
    logOperation("ERROR_ACTUALIZAR_TIPO_JUNTA", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al actualizar tipo de junta", error: error.message });
  }
};

export const eliminarTipoJunta = async (req, res) => {
  try {
    const { idtipojunta } = req.params;
    const id = idtipojunta;

    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const tipo = await TipoJunta.findByPk(id);
    if (!tipo) return res.status(404).json({ message: "Tipo de junta no encontrado" });

    await tipo.destroy();

    logOperation("TIPO_JUNTA_ELIMINADO", req.user || {}, { TipoJunta: id }, "info");

    return res.json({ message: "Tipo de junta eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar tipo de junta:", error);
    logOperation("ERROR_ELIMINAR_TIPO_JUNTA", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al eliminar tipo de junta", error: error.message });
  }
};

export default {
  obtenerTiposJunta,
  obtenerTipoJuntaPorId,
  crearTipoJunta,
  actualizarTipoJunta,
  eliminarTipoJunta,
};
