import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

export const Certificados = sequelize.define('Certificados', {
  IDCertificado: {
    type: DataTypes.SMALLINT,
    autoIncrement: true,
    primaryKey: true,
    field: 'idcertificado'
  },
  FechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fechacreacion'
  },
  IDJunta: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "juntas",
      key: "idjunta"
    },
    field: "idjunta"
  },
  NombreCertificado: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "nombrecertificado"
  },
  TipoCertificado: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: "tipocertificado"
  },
  ElaboradoPor: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "elaborado_por"
  },
  GeneradoPor: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: "generado_por"
  }
}, {
    tableName: "certificados",
    timestamps: false,
});
