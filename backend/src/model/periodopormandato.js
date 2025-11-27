import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const PeriodoPorMandato = sequelize.define("PeriodoPorMandato", {
  IDPeriodo: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    field: "idperiodo",
    references: {
      model: "periodo",
      key: "idperiodo"
    }
  },
  NumeroIdentificacion: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "numeroidentificacion",
    references: {
        model: "MandatarioJunta",
        key: "numeroidentificacion"
    }
  },
  IDJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idjunta",
    references: {
        model: "MandatarioJunta",
        key: "idjunta"
    }
  }
}, {
  tableName: "periodopormandato",
  timestamps: false,
});
