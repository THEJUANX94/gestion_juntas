import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Firma = sequelize.define("Firma", {
  IDFirma: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idfirma"
  },
  NumeroIdentificacion: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "numeroidentificacion"
    },
    field: "numeroidentificacion"
  },
  FechaCreacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: "fechacreacion"
  },
  Ubicacion: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "ubicacion"
  },
  activa: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: "activa",
    defaultValue: true
  }
}, {
  tableName: "firmas",
  timestamps: false
});


