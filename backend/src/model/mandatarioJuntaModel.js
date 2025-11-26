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
    allowNull: true,
    field: "idcargo",
    references: {
      model: "cargos",
      key: "idcargo"
    }
  },

  Residencia: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "residencia",
    references: {
      model: "lugares",
      key: "idlugar"
    }
  },

  Expedido: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "expedido",
    references: {
      model: "lugares",
      key: "idlugar"
    }
  },

  IDComision: {
  type: DataTypes.UUID,
  allowNull: true,
  field: "idcomision",
  references: {
    model: "comisiones",
    key: "idcomision"
  }
},

  Profesion: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "profesion",
  },

}, {
  tableName: "mandatarioJuntas",
  timestamps: false,
  createdAt: 'createdAt'
});
