import { DataTypes } from "sequelize";
import { sequelize } from "../database/database.js";

export const TipoJunta = sequelize.define(
  "TipoJunta",
  {
    idtipojuntas: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      field: "idtipojuntas"
    },
    nombretipojunta: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "nombretipojunta"
    }
  },
  {
    tableName: "tipojuntas",
    timestamps: false
  }
);
