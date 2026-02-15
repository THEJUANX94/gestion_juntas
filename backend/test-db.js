import dotenv from "dotenv";
dotenv.config();

import { sequelize } from "./src/config/database.js";

(async () => {
  try {
    console.log("🔄 Probando conexión a la base de datos...");
    await sequelize.authenticate();
    console.log("✅ Conexión exitosa a PostgreSQL");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conexión a la DB");
    console.error("Mensaje:", error.message);
    process.exit(1);
  }
})();
