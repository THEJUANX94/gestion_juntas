import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const GrupoPoblacional = sequelize.define("GrupoPoblacional", {
  IDGrupoPoblacional: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idgrupopoblacional"
  },
  NombreGrupo: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "nombregrupo"
  }
}, {
  tableName: "grupospoblacionales",
  timestamps: false
});