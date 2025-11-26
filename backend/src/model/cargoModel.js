import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Cargo = sequelize.define("Cargo", {
  IDCargo: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idcargo",
    allowNull: true,
  },

  NombreCargo: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombrecargo",
  }

}, {
  tableName: "cargos",
  timestamps: false,
});
