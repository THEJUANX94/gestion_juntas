import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Documento = sequelize.define("Documento", {
  IDDocumento: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "iddocumento"
  },

  NombreDocumento: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombredocumento"
  },

  TipoDocumento: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "tipodocumento"
  },

  Ubicacion: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "ubicacion"
  },

  IDJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idjunta"
  }

}, {
  tableName: "documentos",
  timestamps: false,
});
