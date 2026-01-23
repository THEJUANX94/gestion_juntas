import { Lugar } from "../model/lugarModel.js";
import { logOperation } from "../utils/logger.js";

export const obtenerLugares = async (req, res) => {
  try {
    const lugares = await Lugar.findAll();
    return res.json(lugares);
  } catch (error) {
    console.error("Error al obtener lugares:", error);
    logOperation("ERROR_OBTENER_LUGARES", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener lugares", error: error.message });
  }
};

export const obtenerMunicipiosPorDepartamento = async (req, res) => {
  try {
    const { departamento } = req.query;
    
    console.log("=== DEBUG ===");
    console.log("Query params:", req.query);
    console.log("Departamento:", departamento);
    
    if (!departamento) {
      console.log("Error: No se proporcionó departamento");
      return res.status(400).json({ 
        message: "Debe especificar el departamento"
      });
    }

    const depto = await Lugar.findOne({
      where: {
        NombreLugar: departamento,
        TipoLugar: 'Departamento'
      }
    });

    console.log("Departamento encontrado:", depto ? depto.IDLugar : "NO ENCONTRADO");

    if (!depto) {
      return res.status(404).json({ 
        message: `Departamento '${departamento}' no encontrado`
      });
    }

    const municipios = await Lugar.findAll({
      where: {
        TipoLugar: 'Municipio',
        IDOtroLugar: depto.IDLugar
      },
      order: [['NombreLugar', 'ASC']]
    });

    console.log(`Municipios encontrados: ${municipios.length}`);
    console.log("=== FIN DEBUG ===");
    
    return res.json(municipios); // Retorna el array directamente
    
  } catch (error) {
    console.error("ERROR en obtenerMunicipiosPorDepartamento:", error);
    logOperation("ERROR_OBTENER_MUNICIPIOS", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ 
      message: "Error al obtener municipios", 
      error: error.message
    });
  }
};

export const obtenerLugarPorId = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const lugar = await Lugar.findByPk(id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    return res.json(lugar);
  } catch (error) {
    console.error("Error al obtener lugar:", error);
    logOperation("ERROR_OBTENER_LUGAR_POR_ID", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al obtener lugar", error: error.message });
  }
};

export const crearLugar = async (req, res) => {
  try {
    const { NombreLugar, TipoLugar, IDOtroLugar } = req.body;

    if (!NombreLugar || !TipoLugar || !IDOtroLugar)
      return res.status(400).json({ message: "Todos los campos son requeridos" });

    const nuevo = await Lugar.create({ NombreLugar, TipoLugar, IDOtroLugar });

    logOperation("LUGAR_CREADO", req.user || {}, { IDLugar: nuevo.IDLugar }, "info");

    return res.status(201).json(nuevo);
  } catch (error) {
    console.error("Error al crear lugar:", error);
    logOperation("ERROR_CREAR_LUGAR", req.user || {}, { error: error.message, body: req.body }, "error");
    return res.status(500).json({ message: "Error al crear lugar", error: error.message });
  }
};

export const actualizarLugar = async (req, res) => {
  try {
    const { id } = req.params;
    const { NombreLugar, TipoLugar, IDOtroLugar } = req.body;

    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const lugar = await Lugar.findByPk(id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    const actualizado = await lugar.update({ NombreLugar, TipoLugar, IDOtroLugar });

    logOperation("LUGAR_ACTUALIZADO", req.user || {}, { IDLugar: id }, "info");

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar lugar:", error);
    logOperation("ERROR_ACTUALIZAR_LUGAR", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al actualizar lugar", error: error.message });
  }
};

export const eliminarLugar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ message: "ID no proporcionado" });

    const lugar = await Lugar.findByPk(id);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    await lugar.destroy();

    logOperation("LUGAR_ELIMINADO", req.user || {}, { IDLugar: id }, "info");

    return res.json({ message: "Lugar eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar lugar:", error);
    logOperation("ERROR_ELIMINAR_LUGAR", req.user || {}, { error: error.message }, "error");
    return res.status(500).json({ message: "Error al eliminar lugar", error: error.message });
  }
};

export const cambiarEstadoLugar = async (req, res) => {
  try {
    const { idlugar } = req.params;
    const { Activo } = req.body; 

    if (!idlugar) return res.status(400).json({ message: "ID no proporcionado" });
    if (Activo === undefined)
      return res.status(400).json({ message: "Activo es requerido" });

    const lugar = await Lugar.findByPk(idlugar);
    if (!lugar) return res.status(404).json({ message: "Lugar no encontrado" });

    lugar.Activo = Activo;
    await lugar.save();

    return res.json(lugar);
  } catch (error) {
    console.error("Error al cambiar estado del lugar:", error);
    return res.status(500).json({ message: "Error al cambiar estado del lugar", error: error.message });
  }
};

export default {
  obtenerLugares,
  obtenerLugarPorId,
  crearLugar,
  actualizarLugar,
  eliminarLugar,
};
