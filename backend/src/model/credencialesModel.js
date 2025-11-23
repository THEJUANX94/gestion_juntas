import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
export const Credenciales = sequelize.define("Credenciales", {
  Login: {
    type: DataTypes.STRING,
    primaryKey: true,
    field: "login"
  },
  numeroIdentificacion: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "usuarios",
      key: "numeroidentificacion"
    },
    field: "numeroidentificacion"
  },
  Contraseña: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "contraseña"
  },
   ultimo_inicio_sesion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "ultimo_inicio_sesion"
  },
  Bloqueado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "bloqueado"
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date()
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: new Date()
  }
}, {
  tableName: "credenciales",
  timestamps: true
});


