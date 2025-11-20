import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const TipoJunta = sequelize.define("TipoJunta", {
  IDTipoJuntas: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idtipojuntas"
  },
  NombreTipoJunta: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "nombretipojunta"
  }
}, {
  tableName: "tipojuntas",
  timestamps: false,
});
