import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Junta = sequelize.define("Junta", {
  IDJunta: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    field: "idjunta"
  },

  RazonSocial: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "razonsocial"
  },

  Direccion: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "direccion"
  },

  NumPersoneriaJuridica: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "numpersoneriajuridica"
  },

  FechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechacreacion"
  },

  FechaInicioPeriodo: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechainicioperiodo"
  },

  FechaFinPeriodo: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechafinperiodo"
  },

  FechaAsamblea: {
    type: DataTypes.DATE,
    allowNull: false,
    field: "fechaasamblea"
  },

  IDTipoJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idtipojunta"
  },

  IDMunicipio: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idmunicipio"
  },

  IDInstitucion: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idinstitucion"
  }

}, {
  tableName: "juntas",
  timestamps: false,
});
