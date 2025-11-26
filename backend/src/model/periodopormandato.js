import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PeriodoPorMandato = sequelize.define("PeriodoPorMandato", {
  IDPeriodo: {
    type: DataTypes.UUID,
    primaryKey: true,
    field: "idperiodo",
    references: {
        model: "periodo",
        key: "idperiodo"
    }
  },
  NumeroIdentificacion: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "numeroidentificacion",
    references: {
        model: "mandatarioJuntas",
        key: "numeroidentificacion"
    }
  },
  IDJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idjunta",
    references: {
        model: "mandatarioJuntas",
        key: "idjunta"
    }
  }
}, {
  tableName: "periodopormandato",
  timestamps: false,
});
