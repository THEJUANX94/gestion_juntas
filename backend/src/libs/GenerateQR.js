import QRCode from "qrcode";

export const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text);
  } catch (err) {
    console.error("Error generando QR:", err);
    return "";
  }
};
