import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Lugar = sequelize.define("Lugar", {
  IDLugar: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idlugar",
  },
  NombreLugar: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombrelugar",
  },
  TipoLugar: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "tipolugar",
  },
  IDOtroLugar: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idotrolugar",
  }
}, {
  tableName: "lugar",
  timestamps: false,
});
