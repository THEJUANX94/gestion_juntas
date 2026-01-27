import { GrupoPoblacional } from "../model/grupopoblacionalModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerGrupos = async (req, res) => {
    try {
        const grupos = await GrupoPoblacional.findAll({
            order: [['NombreGrupo', 'ASC']]
        });
        return res.json(grupos);
    } catch (error) {
        console.error("Error al obtener grupos poblacionales:", error);
        logOperation("ERROR_OBTENER_GRUPOS", req.user || {}, { error: error.message }, "error");
        return res.status(500).json({ 
            message: "Error al obtener grupos poblacionales", 
            error: error.message 
        });
    }
};

export const obtenerGrupoPorId = async (req, res) => {
    try {
        const { idgrupo } = req.params;
        if (!idgrupo) return res.status(400).json({ message: "ID no proporcionado" });

        const grupo = await GrupoPoblacional.findByPk(idgrupo);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        return res.json(grupo);
    } catch (error) {
        console.error("Error al obtener grupo:", error);
        logOperation("ERROR_OBTENER_GRUPO_POR_ID", req.user || {}, { error: error.message }, "error");
        return res.status(500).json({ message: "Error al obtener grupo", error: error.message });
    }
};

export const crearGrupo = async (req, res) => {
    try {
        const { NombreGrupo } = req.body;
        if (!NombreGrupo) return res.status(400).json({ message: "NombreGrupo es requerido" });

        const nuevo = await GrupoPoblacional.create({ NombreGrupo });

        logOperation("GRUPO_POBLACIONAL_CREADO", req.user || {}, { IDGrupo: nuevo.IDGrupo, NombreGrupo }, "info");

        return res.status(201).json(nuevo);
    } catch (error) {
        console.error("Error al crear grupo:", error);
        logOperation("ERROR_CREAR_GRUPO", req.user || {}, { error: error.message, body: req.body }, "error");
        return res.status(500).json({ message: "Error al crear grupo", error: error.message });
    }
};

export const actualizarGrupo = async (req, res) => {
    try {
        const { idgrupo } = req.params;
        const { NombreGrupo } = req.body;
        if (!idgrupo) return res.status(400).json({ message: "ID no proporcionado" });

        const grupo = await GrupoPoblacional.findByPk(idgrupo);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        const actualizado = await grupo.update({ NombreGrupo });

        logOperation("GRUPO_ACTUALIZADO", req.user || {}, { IDGrupo: idgrupo, NombreGrupo: actualizado.NombreGrupo }, "info");

        return res.json(actualizado);
    } catch (error) {
        console.error("Error al actualizar grupo:", error);
        logOperation("ERROR_ACTUALIZAR_GRUPO", req.user || {}, { error: error.message, params: req.params, body: req.body }, "error");
        return res.status(500).json({ message: "Error al actualizar grupo", error: error.message });
    }
};

export const eliminarGrupo = async (req, res) => {
    try {
        const { idgrupo } = req.params;
        if (!idgrupo) return res.status(400).json({ message: "ID no proporcionado" });

        const grupo = await GrupoPoblacional.findByPk(idgrupo);
        if (!grupo) return res.status(404).json({ message: "Grupo no encontrado" });

        await grupo.destroy();

        logOperation("GRUPO_ELIMINADO", req.user || {}, { IDGrupo: idgrupo }, "info");

        return res.json({ message: "Grupo eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar grupo:", error);
        logOperation("ERROR_ELIMINAR_GRUPO", req.user || {}, { error: error.message, params: req.params }, "error");
        return res.status(500).json({ message: "Error al eliminar grupo", error: error.message });
    }
};

export default {
    obtenerGrupos,
    obtenerGrupoPorId,
    crearGrupo,
    actualizarGrupo,
    eliminarGrupo,
};