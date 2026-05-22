import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  logging: false,
  pool: {
    max: 20,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    freezeTableName: true,
    underscored: false
  },
});

