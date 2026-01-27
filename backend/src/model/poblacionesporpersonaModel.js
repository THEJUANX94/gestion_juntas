import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PoblacionesPorPersona = sequelize.define("PoblacionesPorPersona", {
  IDGrupoPoblacional: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idperiodo",
    primaryKey: true
  },
  NumeroIdentificacion: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "numeroidentificacion",
    primaryKey: true
  }
}, {
  tableName: "poblacionesporpersona",
  timestamps: false
});
