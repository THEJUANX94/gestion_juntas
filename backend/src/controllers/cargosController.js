import { Cargo } from "../model/cargoModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerCargos = async (req, res) => {
	try {
		const cargos = await Cargo.findAll();
		return res.json(cargos);
	} catch (error) {
		console.error("Error al obtener cargos:", error);
		logOperation("ERROR_OBTENER_CARGOS", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener cargos", error: error.message });
	}
};

export const obtenerCargoPorId = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "ID no proporcionado" });

		const cargo = await Cargo.findByPk(id);
		if (!cargo) return res.status(404).json({ message: "Cargo no encontrado" });

		return res.json(cargo);
	} catch (error) {
		console.error("Error al obtener cargo:", error);
		logOperation("ERROR_OBTENER_CARGO_POR_ID", req.user || {}, { error: error.message }, "error");
		return res.status(500).json({ message: "Error al obtener cargo", error: error.message });
	}
};

export const crearCargo = async (req, res) => {
	try {
		const { NombreCargo } = req.body;
		if (!NombreCargo) return res.status(400).json({ message: "NombreCargo es requerido" });

		const nuevo = await Cargo.create({ NombreCargo });

		logOperation("CARGO_CREADO", req.user || {}, { IDCargo: nuevo.IDCargo, NombreCargo }, "info");

		return res.status(201).json(nuevo);
	} catch (error) {
		console.error("Error al crear cargo:", error);
		logOperation("ERROR_CREAR_CARGO", req.user || {}, { error: error.message, body: req.body }, "error");
		return res.status(500).json({ message: "Error al crear cargo", error: error.message });
	}
};

export const actualizarCargo = async (req, res) => {
	try {
		const { id } = req.params;
		const { NombreCargo } = req.body;
		if (!id) return res.status(400).json({ message: "ID no proporcionado" });

		const cargo = await Cargo.findByPk(id);
		if (!cargo) return res.status(404).json({ message: "Cargo no encontrado" });

		const actualizado = await cargo.update({ NombreCargo });

		logOperation("CARGO_ACTUALIZADO", req.user || {}, { IDCargo: id, NombreCargo: actualizado.NombreCargo }, "info");

		return res.json(actualizado);
	} catch (error) {
		console.error("Error al actualizar cargo:", error);
		logOperation("ERROR_ACTUALIZAR_CARGO", req.user || {}, { error: error.message, params: req.params, body: req.body }, "error");
		return res.status(500).json({ message: "Error al actualizar cargo", error: error.message });
	}
};

export const eliminarCargo = async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ message: "ID no proporcionado" });

		const cargo = await Cargo.findByPk(id);
		if (!cargo) return res.status(404).json({ message: "Cargo no encontrado" });

		await cargo.destroy();

		logOperation("CARGO_ELIMINADO", req.user || {}, { IDCargo: id }, "info");

		return res.json({ message: "Cargo eliminado correctamente" });
	} catch (error) {
		console.error("Error al eliminar cargo:", error);
		logOperation("ERROR_ELIMINAR_CARGO", req.user || {}, { error: error.message, params: req.params }, "error");
		return res.status(500).json({ message: "Error al eliminar cargo", error: error.message });
	}
};

export default {
	obtenerCargos,
	obtenerCargoPorId,
	crearCargo,
	actualizarCargo,
	eliminarCargo,
};

