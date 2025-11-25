import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Reconocida = sequelize.define("Reconocida", {
  IDReconocida: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idreconocida"
  },

  Nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombre"
  }

}, {
  tableName: "reconocida",
  timestamps: false,
});
