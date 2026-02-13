import { Firma } from "../model/firmaModel.js";
import { Usuario } from "../model/usuarioModel.js";
import { logger } from "../utils/logger.js";
import { Op } from "sequelize";

export const obtenerFirmas = async (req, res) => {
  try {
    const { nombre } = req.query;

    const whereClause = nombre
      ? {
        [Op.or]: [
          { PrimerNombre: { [Op.iLike]: `%${nombre}%` } },
          { PrimerApellido: { [Op.iLike]: `%${nombre}%` } },
        ],
      }
      : {};

    const firmas = await Firma.findAll({
      include: [
        {
          model: Usuario,
          where: whereClause,
          attributes: [
            "PrimerNombre",
            "SegundoNombre",
            "PrimerApellido",
            "SegundoApellido",
            "Correo",
          ],
        },
      ],
      order: [["FechaCreacion", "DESC"]],
    });

    res.json(firmas);
  } catch (err) {
    console.error("Error al obtener firmas:", err);
    res.status(500).json({ error: "Error al obtener firmas." });
  }
};

export const obtenerFirmaPorId = async (req, res) => {
  try {
    const { IDFirma } = req.params;

    const firma = await Firma.findByPk(IDFirma, {
      include: [
        {
          model: Usuario,
          attributes: [
            "PrimerNombre",
            "SegundoNombre",
            "PrimerApellido",
            "SegundoApellido",
            "Correo",
          ],
        },
      ],
    });

    if (!firma) {
      return res.status(404).json({ error: "Firma no encontrada." });
    }

    res.json(firma);
  } catch (err) {
    console.error("Error al obtener firma:", err);
    res.status(500).json({ error: "Error al obtener firma." });
  }
};

export const eliminarFirma = async (req, res) => {
  try {
    const { IDFirma } = req.params;

    const firma = await Firma.findByPk(IDFirma);
    if (!firma) {
      return res.status(404).json({ error: "Firma no encontrada." });
    }

    const path = firma.Ubicacion.split("/storage/v1/object/public/Firmas/")[1];

    await firma.destroy();

    logger("ELIMINAR_FIRMA", { IDFirma }, "sistema");

    res.json({ message: "Firma eliminada correctamente." });
  } catch (err) {
    console.error("Error al eliminar firma:", err);
    res.status(500).json({ error: "Error al eliminar firma." });
  }
};

export const getUltimaFirmaData = async () => {
  try {
    const firmaActiva = await Firma.findOne({
      // Cambia 'Activo' por 'activa' (como está definido en tu modelo)
      where: { activa: true },
      include: [
        {
          model: Usuario,
          attributes: [
            "PrimerNombre",
            "SegundoNombre",
            "PrimerApellido",
            "SegundoApellido",
            "Sexo"
          ],
        },
      ],
    });

    if (!firmaActiva) {
      return null;
    }

    const usuario = firmaActiva.Usuario;

    const nombreCompleto = [
      usuario.PrimerNombre,
      usuario.SegundoNombre,
      usuario.PrimerApellido,
      usuario.SegundoApellido,
    ]
      .filter((n) => n)
      .join(" ")
      .toUpperCase();

    const titulo = (usuario.Sexo && usuario.Sexo.toUpperCase() === 'MASCULINO')
      ? "SECRETARIO"
      : "SECRETARIA";

    const cargoDinamico = `${titulo} DE GOBIERNO Y ACCIÓN COMUNAL`;

    return {
      nombreFirmante: nombreCompleto,
      cargo: cargoDinamico,
      ubicacion: firmaActiva.Ubicacion,
    };
  } catch (error) {
    console.error("Error en el servicio getUltimaFirmaData:", error.message);
    throw new Error("Fallo al consultar los datos de la firma activa.");
  }
};

// En tu backend (controlador de usuarios/firmas)
export const actualizarEstadoFirma = async (req, res) => {
  const { identificacion } = req.params;
  const { Activo } = req.body;

  try {
    // Si se está activando una firma
    if (Activo === true) {
      // Primero desactiva TODAS las firmas
      await Firma.update(
        { activa: false },
        { where: {} }
      );
    }

    // Luego actualiza la firma específica
    const usuario = await Usuario.findOne({
      where: { Identificacion: identificacion }
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const [numUpdated] = await Firma.update(
      { activa: Activo },
      { where: { IDUsuario: usuario.IDUsuario } }
    );

    if (numUpdated === 0) {
      return res.status(404).json({ error: "Firma no encontrada" });
    }

    res.json({ 
      success: true, 
      mensaje: `Firma ${Activo ? 'activada' : 'desactivada'} correctamente` 
    });

  } catch (error) {
    console.error("Error al actualizar firma:", error);
    res.status(500).json({ error: "Error al actualizar el estado de la firma" });
  }
};
