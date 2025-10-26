import { useState, useEffect } from "react";
import { applyTheme } from "../utils/theme";
import { Card } from "../components/ui/card";
import Footer from "../components/ui/Footer";

export default function Configuracion() {
  const [logo, setLogo] = useState(localStorage.getItem("logo") || "/logo.png");
  const [fuente, setFuente] = useState(localStorage.getItem("fuente") || "nunito");

  const normalizeColor = (color) => {
    if (color.startsWith("color-mix")) {
      if (color.includes("#526bceff")) return "#526bce"; 
      return "#ffffff";
    }

    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    const computed = ctx.fillStyle;

    if (computed.startsWith("rgb")) {
      const rgb = computed.match(/\d+/g).map(Number);
      return (
        "#" +
        rgb
          .map((x) => x.toString(16).padStart(2, "0"))
          .join("")
      );
    }
    return computed;
  };

  const defaultTheme = {
    "color-background-upper": "#ffffffff",
    "color-text-color-upper": "#000000ff",
    "color-background-sidebar": "#f0f0f0ff",
    "color-text-color-sidebar-pr": "#000000ff",
    "color-text-color-sidebar-sec": "#000000ff",
    "color-hover-bg": "color-mix(in srgb, #ffffffff, white 50%)",
    "color-hover-text": "color-mix(in srgb, #526bceff, black 20%)",
    "color-background-page": "rgb(232, 232, 232)",
    "color-text-color-page": "#000000ff",
  };

  const defaultFuente = "nunito";

  const [theme, setTheme] = useState(
    JSON.parse(localStorage.getItem("theme")) ||
      Object.fromEntries(
        Object.entries(defaultTheme).map(([k, v]) => [k, normalizeColor(v)])
      )
  );

  const fuentes = {
    sans: "system-ui, sans-serif",
    serif: "serif",
    mono: "monospace",
    arial: "Arial, Helvetica, sans-serif",
    georgia: "Georgia, serif",
    verdana: "Verdana, Geneva, sans-serif",
    nunito: "'Nunito Sans', sans-serif",
  };

  useEffect(() => {
    document.body.style.fontFamily = fuentes[fuente] || fuentes.sans;
    applyTheme(theme);
  }, [fuente, theme]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem("logo", reader.result);
        setLogo(reader.result);
        window.dispatchEvent(
          new CustomEvent("logoChanged", { detail: reader.result })
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e, key) => {
    const newTheme = { ...theme, [key]: e.target.value };
    setTheme(newTheme);
    localStorage.setItem("theme", JSON.stringify(newTheme));
  };

  const handleFuenteChange = (e) => {
    const value = e.target.value;
    setFuente(value);
    localStorage.setItem("fuente", value);
  };

  const resetConfig = () => {
    const normalizedDefaults = Object.fromEntries(
      Object.entries(defaultTheme).map(([k, v]) => [k, normalizeColor(v)])
    );
    setTheme(normalizedDefaults);
    setFuente(defaultFuente);
    localStorage.removeItem("theme");
    localStorage.removeItem("fuente");
  };

  const friendlyNames = {
    "color-background-upper": "Fondo del Header",
    "color-text-color-upper": "Texto del Header",
    "color-background-sidebar": "Fondo de la Barra Lateral",
    "color-text-color-sidebar-pr": "Texto Principal de la Barra",
    "color-text-color-sidebar-sec": "Texto Secundario de la Barra",
    "color-hover-bg": "Fondo al pasar el ratón",
    "color-hover-text": "Texto al pasar el ratón",
    "color-background-page": "Fondo de la Página",
    "color-text-color-page": "Texto de la Página",
  };

  const renderColorInputs = (groupLabel, keys) => (
    <Card className="p-4 shadow-md">
      <h4 className="text-lg font-semibold mb-3">{groupLabel}</h4>
      <div className="grid grid-cols-2 gap-4">
        {keys.map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-sm font-medium mb-1">
              {friendlyNames[key] || key}
            </label>
            <input
              type="color"
              value={normalizeColor(theme[key])}
              onChange={(e) => handleColorChange(e, key)}
              className="w-16 h-8 p-0 border rounded cursor-pointer"
            />
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div
      className="p-6"
      style={{ backgroundColor: "var(--color-background-page)" }}
    >
      <h2 className="text-3xl font-bold mb-6">Configuración</h2>

      {/* Grid general */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo */}
        <Card className="p-4 shadow-md">
          <h3 className="text-xl font-semibold mb-3">Logo</h3>
          <input type="file" accept="image/*" onChange={handleLogoChange} />
          <div className="mt-3">
            <img src={logo} alt="Logo" className="h-16 w-auto border rounded" />
          </div>
        </Card>

        {/* Fuente */}
        <Card className="p-4 shadow-md">
          <h3 className="text-xl font-semibold mb-3">Fuente</h3>
          <select
            value={fuente}
            onChange={handleFuenteChange}
            className="w-full border rounded p-2"
          >
            <option value="sans">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
            <option value="arial">Arial</option>
            <option value="georgia">Georgia</option>
            <option value="verdana">Verdana</option>
            <option value="nunito">Nunito Sans</option>
          </select>
        </Card>

        {/* Colores */}
        <div className="lg:col-span-2">
          <h3 className="text-2xl font-bold mb-4">Colores de la Aplicación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderColorInputs("Header", [
              "color-background-upper",
              "color-text-color-upper",
            ])}

            {renderColorInputs("Barra Lateral", [
              "color-background-sidebar",
              "color-text-color-sidebar-pr",
              "color-text-color-sidebar-sec",
              "color-hover-bg",
              "color-hover-text",
            ])}

            {renderColorInputs("Página", [
              "color-background-page",
              "color-text-color-page",
            ])}
          </div>
        </div>
      </div>

      {/* Botón Reset */}
      <button
        onClick={resetConfig}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Restablecer Colores y Fuente por Defecto
      </button>

      <Footer />
    </div>
  );
}
