import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Comisiones = sequelize.define("Comisiones", {
  IDComision: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idcomision"
  },

  Nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombre"
  }

}, {
  tableName: "comisiones",
  timestamps: false,
});
