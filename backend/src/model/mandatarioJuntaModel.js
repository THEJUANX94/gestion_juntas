import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const MandatarioJunta = sequelize.define("MandatarioJunta", {
  NumeroIdentificacion: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: "numeroidentificacion",
  },

  IDJunta: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: "idjunta",
  },

  IDCargo: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idcargo",
  },

  FechaInicioPeriodo: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechainicioperiodo",
  },

  FechaFinPeriodo: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechafinperiodo",
  },

  Residencia: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "residencia",
  },

  Expedido: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "expedido",
  }

}, {
  tableName: "mandatariosjunta",
  timestamps: false,
});
