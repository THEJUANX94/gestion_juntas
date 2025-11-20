import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Firma = sequelize.define("Firma", {
  IDFirma: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idfirma"
  },
  numeroIdentificacion: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "numeroIdentificacion"
    },
    field: "numeroIdentificacion"
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


