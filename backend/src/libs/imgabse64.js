import fs from "fs";

export const imageToBase64 = async (filePath) => {
  try {
    const imageBuffer = await fs.promises.readFile(filePath);
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  } catch (err) {
    throw new Error("No se pudo leer el archivo de imagen: " + err.message);
  }
};

export const logoPath = "./src/libs/Logo.png";
