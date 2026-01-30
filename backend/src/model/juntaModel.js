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

  Zona: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "zona"
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

  TipoJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "tipojunta"
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
  },

  IDReconocida: {
    type: DataTypes.UUID,
    allowNull: false,
    field: "idreconocida"
  },

  Correo: {
    type: DataTypes.STRING,
    allowNull: false,
    field: "correo"
  },
  Activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "activo"
  }

}, {
  tableName: "juntas",
  timestamps: false,
});
