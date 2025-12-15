import { Institucion } from "../model/institucionModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerInstituciones = async (req, res) => {
	try {
		const instituciones = await Institucion.findAll();
		return res.json(instituciones);
	} catch (error) {
		console.error("Error al obtener instituciones:", error);
		logOperation("ERROR_OBTENER_INSTITUCIONES", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener instituciones", error: error.message });
	}
};

export const obtenerInstitucionPorId = async (req, res) => {
	try {
		const { idinstitucion } = req.params;
		if (!idinstitucion) return res.status(400).json({ message: "ID no proporcionado" });

		const institucion = await Institucion.findByPk(idinstitucion);
		if (!institucion) return res.status(404).json({ message: "Institución no encontrada" });

		return res.json(institucion);
	} catch (error) {
		console.error("Error al obtener institución:", error);
		logOperation("ERROR_OBTENER_INSTITUCION_POR_ID", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener institución", error: error.message });
	}
};

export const crearInstitucion = async (req, res) => {
	try {
		const { NombreInstitucion } = req.body;
		if (!NombreInstitucion) return res.status(400).json({ message: "NombreInstitucion es requerido" });

		const nueva = await Institucion.create({ NombreInstitucion });

		logOperation("INSTITUCION_CREADA", req.user || {}, { IDInstitucion: nueva.IDInstitucion, NombreInstitucion }, "info");

		return res.status(201).json(nueva);
	} catch (error) {
		console.error("Error al crear institución:", error);
		logOperation("ERROR_CREAR_INSTITUCION", req.user || {}, { error: error.message, body: req.body }, "error");
		return res.status(500).json({ message: "Error al crear institución", error: error.message });
	}
};

export const actualizarInstitucion = async (req, res) => {
	try {
		const { idinstitucion } = req.params;
		const { NombreInstitucion } = req.body;
		if (!idinstitucion) return res.status(400).json({ message: "ID no proporcionado" });

		const institucion = await Institucion.findByPk(idinstitucion);
		if (!institucion) return res.status(404).json({ message: "Institución no encontrada" });

		const actualizado = await institucion.update({ NombreInstitucion });

		logOperation("INSTITUCION_ACTUALIZADA", req.user || {}, { IDInstitucion: idinstitucion, NombreInstitucion: actualizado.NombreInstitucion }, "info");

		return res.json(actualizado);
	} catch (error) {
		console.error("Error al actualizar institución:", error);
		logOperation("ERROR_ACTUALIZAR_INSTITUCION", req.user || {}, { error: error.message, params: req.params, body: req.body }, "error");
		return res.status(500).json({ message: "Error al actualizar institución", error: error.message });
	}
};

export const eliminarInstitucion = async (req, res) => {
	try {
		const { idinstitucion } = req.params;
		if (!idinstitucion) return res.status(400).json({ message: "ID no proporcionado" });

		const institucion = await Institucion.findByPk(idinstitucion);
		if (!institucion) return res.status(404).json({ message: "Institución no encontrada" });

		await institucion.destroy();

		logOperation("INSTITUCION_ELIMINADA", req.user || {}, { IDInstitucion: idinstitucion }, "info");

		return res.json({ message: "Institución eliminada correctamente" });
	} catch (error) {
		console.error("Error al eliminar institución:", error);
		logOperation("ERROR_ELIMINAR_INSTITUCION", req.user || {}, { error: error.message, params: req.params }, "error");
		return res.status(500).json({ message: "Error al eliminar institución", error: error.message });
	}
};

export default {
	obtenerInstituciones,
	obtenerInstitucionPorId,
	crearInstitucion,
	actualizarInstitucion,
	eliminarInstitucion,
};

