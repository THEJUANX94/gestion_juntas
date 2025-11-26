import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const TipoDocumento = sequelize.define("TipoDocumento", {
  IDTipoDocumento: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idtipodocumento",
  },

  NombreTipo: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombretipo",
  }

}, {
  tableName: "tipodocumento",
  timestamps: false,
});
