import { PoblacionesPorPersona } from "../model/poblacionesporpersonaModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerPoblacionesPorPersona = async (req, res) => {
	try {
		const poblaciones = await PoblacionesPorPersona.findAll();
		return res.json(poblaciones);
	} catch (error) {
		console.error("Error al obtener poblaciones por persona:", error);
		logOperation("ERROR_OBTENER_POBLACIONES_POR_PERSONA", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener poblaciones por persona", error: error.message });
	}
};

export const obtenerPoblacionesPorDocumento = async (req, res) => {
	try {
		const { documento } = req.params;
		if (!documento) return res.status(400).json({ message: "Documento no proporcionado" });

		const poblaciones = await PoblacionesPorPersona.findAll({
			where: { NumeroIdentificacion: documento }
		});

		return res.json(poblaciones);
	} catch (error) {
		console.error("Error al obtener poblaciones por documento:", error);
		logOperation("ERROR_OBTENER_POBLACIONES_POR_DOCUMENTO", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener poblaciones por documento", error: error.message });
	}
};

export const crearPoblacionPorPersona = async (req, res) => {
	try {
		const { NumeroIdentificacion, IDGrupoPoblacional } = req.body;
		
		if (!NumeroIdentificacion || !IDGrupoPoblacional) {
			return res.status(400).json({ message: "NumeroIdentificacion e IDGrupoPoblacional son requeridos" });
		}

		const nueva = await PoblacionesPorPersona.create({ 
			NumeroIdentificacion, 
			IDGrupoPoblacional 
		});

		logOperation("POBLACION_POR_PERSONA_CREADA", req.user || {}, { 
			NumeroIdentificacion, 
			IDGrupoPoblacional 
		}, "info");

		return res.status(201).json(nueva);
	} catch (error) {
		console.error("Error al crear población por persona:", error);
		logOperation("ERROR_CREAR_POBLACION_POR_PERSONA", req.user || {}, { error: error.message, body: req.body }, "error");
		return res.status(500).json({ message: "Error al crear población por persona", error: error.message });
	}
};

export const actualizarPoblacionPorPersona = async (req, res) => {
	try {
		const { documento, idgrupo } = req.params;
		const { NuevoIDGrupoPoblacional } = req.body;
		
		if (!documento || !idgrupo) {
			return res.status(400).json({ message: "Documento e ID de grupo no proporcionados" });
		}

		const poblacion = await PoblacionesPorPersona.findOne({
			where: {
				NumeroIdentificacion: documento,
				IDGrupoPoblacional: idgrupo
			}
		});

		if (!poblacion) {
			return res.status(404).json({ message: "Población por persona no encontrada" });
		}

		const actualizado = await poblacion.update({ 
			IDGrupoPoblacional: NuevoIDGrupoPoblacional || idgrupo 
		});

		logOperation("POBLACION_POR_PERSONA_ACTUALIZADA", req.user || {}, { 
			NumeroIdentificacion: documento, 
			IDGrupoPoblacional: actualizado.IDGrupoPoblacional 
		}, "info");

		return res.json(actualizado);
	} catch (error) {
		console.error("Error al actualizar población por persona:", error);
		logOperation("ERROR_ACTUALIZAR_POBLACION_POR_PERSONA", req.user || {}, { error: error.message, params: req.params, body: req.body }, "error");
		return res.status(500).json({ message: "Error al actualizar población por persona", error: error.message });
	}
};

export const eliminarPoblacionPorPersona = async (req, res) => {
	try {
		const { documento, idgrupo } = req.params;
		
		if (!documento || !idgrupo) {
			return res.status(400).json({ message: "Documento e ID de grupo no proporcionados" });
		}

		const poblacion = await PoblacionesPorPersona.findOne({
			where: {
				NumeroIdentificacion: documento,
				IDGrupoPoblacional: idgrupo
			}
		});

		if (!poblacion) {
			return res.status(404).json({ message: "Población por persona no encontrada" });
		}

		await poblacion.destroy();

		logOperation("POBLACION_POR_PERSONA_ELIMINADA", req.user || {}, { 
			NumeroIdentificacion: documento, 
			IDGrupoPoblacional: idgrupo 
		}, "info");

		return res.json({ message: "Población por persona eliminada correctamente" });
	} catch (error) {
		console.error("Error al eliminar población por persona:", error);
		logOperation("ERROR_ELIMINAR_POBLACION_POR_PERSONA", req.user || {}, { error: error.message, params: req.params }, "error");
		return res.status(500).json({ message: "Error al eliminar población por persona", error: error.message });
	}
};

// Función especial para eliminar todas las poblaciones de un documento
export const eliminarPoblacionesPorDocumento = async (req, res) => {
	try {
		const { documento } = req.params;
		if (!documento) return res.status(400).json({ message: "Documento no proporcionado" });

		const cantidad = await PoblacionesPorPersona.destroy({
			where: { NumeroIdentificacion: documento }
		});

		logOperation("POBLACIONES_POR_DOCUMENTO_ELIMINADAS", req.user || {}, { 
			NumeroIdentificacion: documento, 
			cantidad 
		}, "info");

		return res.json({ message: `${cantidad} poblaciones eliminadas correctamente` });
	} catch (error) {
		console.error("Error al eliminar poblaciones por documento:", error);
		logOperation("ERROR_ELIMINAR_POBLACIONES_POR_DOCUMENTO", req.user || {}, { error: error.message, params: req.params }, "error");
		return res.status(500).json({ message: "Error al eliminar poblaciones por documento", error: error.message });
	}
};