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

export const obtenerComisionPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const comision = await Comisiones.findByPk(id);
    if (!comision) return res.status(404).json({ message: "Comisión no encontrada" });

    return res.json(comision);
  } catch (error) {
    console.error("Error al obtener comisión por ID:", error);
    logOperation("ERROR_OBTENER_COMISION_POR_ID", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener la comisión", error: error.message });
  }
};

export const crearComision = async (req, res) => {
  try {
    const { Nombre } = req.body;
    if (!Nombre) return res.status(400).json({ message: "Nombre es requerido" });

    const nuevo = await Comisiones.create({ Nombre });

    logOperation("COMISION_CREADA", req.user || {}, { IDComision: nuevo.IDComision, Nombre }, "info");

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear comisión:", error);
    logOperation("ERROR_CREAR_COMISION", req.user || {}, { error: error.message, body: req.body }, "error");
    return res.status(500).json({ message: "Error al crear la comisión", error: error.message });
  }
};

export const actualizarComision = async (req, res) => {
  try {
    const { idcomision } = req.params;
    const { Nombre } = req.body;
    if (!idcomision) return res.status(400).json({ message: "ID no proporcionado" });

    const comision = await Comisiones.findByPk(idcomision);
    if (!comision) return res.status(404).json({ message: "Comisión no encontrada" });

    const actualizado = await comision.update({ Nombre });

    logOperation("COMISION_ACTUALIZADA", req.user || {}, { IDComision: idcomision, Nombre: actualizado.Nombre }, "info");

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar comisión:", error);
    logOperation("ERROR_ACTUALIZAR_COMISION", req.user || {}, { error: error.message, params: req.params, body: req.body }, "error");
    return res.status(500).json({ message: "Error al actualizar la comisión", error: error.message });
  }
};

export const eliminarComision = async (req, res) => {
  try {
    const { idcomision } = req.params;
    if (!idcomision) return res.status(400).json({ message: "ID no proporcionado" });

    const comision = await Comisiones.findByPk(idcomision);
    if (!comision) return res.status(404).json({ message: "Comisión no encontrada" });

    await comision.destroy();

    logOperation("COMISION_ELIMINADA", req.user || {}, { IDComision: idcomision }, "info");

    return res.json({ message: "Comisión eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar comisión:", error);
    logOperation("ERROR_ELIMINAR_COMISION", req.user || {}, { error: error.message, params: req.params }, "error");
    return res.status(500).json({ message: "Error al eliminar la comisión", error: error.message });
  }
};

export default {
  obtenerComisiones,
  obtenerComisionPorId,
  crearComision,
  actualizarComision,
  eliminarComision,
};