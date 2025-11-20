import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Rol = sequelize.define("Rol", {
  IDRol: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idrol"
  },
  NombreRol: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombrerol"
  }
}, {
  tableName: "roles",
  timestamps: false
});
