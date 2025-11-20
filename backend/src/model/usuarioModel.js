// src/model/usuarioModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Usuario = sequelize.define("Usuario", {
  NumeroIdentificacion: {
    field: "numeroidentificacion",
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
  },
  PrimerApellido:{
    field: "primerapellido",
    type: DataTypes.STRING,
  } ,
  SegundoApellido: {
    field: "segundoapellido",
    type: DataTypes.STRING,
  },
  PrimerNombre: {
    field: "primernombre",
    type:  DataTypes.STRING,
  },
  SegundoNombre: {
    field: "segundonombre",
    type: DataTypes.STRING,
  },
  FechaNacimiento: {
    field: "fechanacimiento",
    type: DataTypes.DATEONLY,
  },
  Sexo: {
    field: "sexo",
    type: DataTypes.STRING,
  },
  TipoSangre: {
    field: "tiposangre",
    type: DataTypes.STRING,
  },
  Correo: {
    field : "correo",
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  Celular: {
    field: "celular",
    type: DataTypes.STRING,
  },
  IDRol: {
    field: "idrol",
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "roles", 
      key: "idrol"
    },
    field: "idrol"
  },
  ultimo_inicio_sesion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: "ultimo_inicio_sesion"
  },
  Activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "activo"
  }
}, {
  tableName: "usuarios",
  timestamps: false,
});
