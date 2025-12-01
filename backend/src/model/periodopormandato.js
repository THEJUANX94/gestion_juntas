import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PeriodoPorMandato = sequelize.define("PeriodoPorMandato", {
    IDPeriodoMandato: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idperiodomandato"
  },
  
  IDPeriodo: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idperiodo"
  },
  NumeroIdentificacion: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "numeroidentificacion"
  },
  IDJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idjunta"
  }
}, {
  tableName: "periodopormandato",
  timestamps: false
});
