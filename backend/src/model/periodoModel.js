import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Periodo = sequelize.define("Periodo", {
  IDPeriodo: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idperiodo",
  },
  FechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechainicio",
  },
  FechaFin: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechafin",
  }
}, {
  tableName: "periodo",
  timestamps: false,
});
