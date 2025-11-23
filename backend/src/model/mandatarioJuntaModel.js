import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const MandatarioJunta = sequelize.define("MandatarioJunta", {
  NumeroIdentificacion: {
    type: DataTypes.TEXT,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "numeroidentificacion"
    },
    field: "numeroidentificacion",
    primaryKey: true
  },

  IDJunta: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: "idjunta",
    references: {
      model: "juntas",
      key: "idjunta"
    }
  },

  IDCargo: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idcargo",
    references: {
      model: "cargos",
      key: "idcargo"
    }
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
