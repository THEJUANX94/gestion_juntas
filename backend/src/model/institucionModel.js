import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Institucion = sequelize.define("Institucion", {
  IDInstitucion: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idinstitucion"
  },

  NombreInstitucion: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombreinstitucion"
  }

}, {
  tableName: "instituciones",
  timestamps: false,
});
