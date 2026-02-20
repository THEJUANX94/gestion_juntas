import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { Op } from "sequelize";
import { Cargo } from "../model/cargoModel.js";
import { Comisiones } from "../model/comisionModel.js";
import { Junta } from "../model/juntaModel.js";
import { Lugar } from "../model/lugarModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { Usuario } from "../model/usuarioModel.js";

const REPORT_TITLES = {
  edades: "Reporte de Edades",
  comisiones: "Reporte de Comisiones",
  activas: "Reporte de Juntas Activas",
  cargos: "Reporte de Cargos",
  genero: "Reporte de Genero",
  provincias: "Reporte de Provincias de Boyaca",
  municipios: "Reporte de Municipios de Boyaca"
};

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const splitCsv = (value) =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const getLugarId = (lugar) => lugar?.IDLugar ?? lugar?.idlugar ?? null;
const getLugarParentId = (lugar) => lugar?.IDOtroLugar ?? lugar?.idotrolugar ?? null;
const getLugarNombre = (lugar) => lugar?.NombreLugar ?? lugar?.nombrelugar ?? "";
const getLugarTipo = (lugar) => lugar?.TipoLugar ?? lugar?.tipolugar ?? "";

const sortByName = (items) =>
  [...items].sort((a, b) =>
    getLugarNombre(a).localeCompare(getLugarNombre(b), "es", { sensitivity: "base" })
  );

const sortPairsByValueDesc = (pairs) =>
  [...pairs].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return String(a[0]).localeCompare(String(b[0]), "es", { sensitivity: "base" });
  });

const filterByLabels = (data, labels = []) => {
  if (!labels.length) return data;

  const allowed = new Set(labels.map(normalizeText));
  const filteredLabels = [];
  const filteredSeries = [];

  (data.labels || []).forEach((label, index) => {
    if (allowed.has(normalizeText(label))) {
      filteredLabels.push(label);
      filteredSeries.push(data.series?.[index] ?? 0);
    }
  });

  return {
    ...data,
    labels: filteredLabels,
    series: filteredSeries
  };
};

const getReportTitle = (tipo) => REPORT_TITLES[tipo] || `Reporte: ${tipo}`;

const sanitizeFilename = (value = "reporte") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "reporte";

const dedupeByLugarId = (items) => {
  const map = new Map();

  items.forEach((item) => {
    const id = getLugarId(item);
    if (id && !map.has(id)) map.set(id, item);
  });

  return Array.from(map.values());
};

const getBoyacaStructure = async () => {
  const lugares = await Lugar.findAll({
    attributes: ["IDLugar", "NombreLugar", "TipoLugar", "IDOtroLugar"]
  });

  const departamentoBoyaca = lugares.find(
    (lugar) =>
      normalizeText(getLugarTipo(lugar)) === "DEPARTAMENTO" &&
      normalizeText(getLugarNombre(lugar)) === "BOYACA"
  );

  if (!departamentoBoyaca) {
    return {
      departamentoBoyaca: null,
      provincias: [],
      municipios: []
    };
  }

  const idBoyaca = getLugarId(departamentoBoyaca);
  const provinciasBoyaca = sortByName(
    dedupeByLugarId(
      lugares.filter(
        (lugar) =>
          normalizeText(getLugarTipo(lugar)) === "PROVINCIA" &&
          getLugarParentId(lugar) === idBoyaca
      )
    )
  );

  const provinciasIds = new Set(provinciasBoyaca.map((provincia) => getLugarId(provincia)));
  const municipiosBoyaca = sortByName(
    dedupeByLugarId(
      lugares.filter(
        (lugar) =>
          normalizeText(getLugarTipo(lugar)) === "MUNICIPIO" &&
          provinciasIds.has(getLugarParentId(lugar))
      )
    )
  );

  return {
    departamentoBoyaca,
    provincias: provinciasBoyaca,
    municipios: municipiosBoyaca
  };
};

const countJuntasByMunicipioIds = async (municipioIds) => {
  const safeIds = [...new Set(municipioIds.filter(Boolean))];
  const counts = new Map();

  if (!safeIds.length) return counts;

  const juntas = await Junta.findAll({
    attributes: ["IDMunicipio"],
    where: {
      IDMunicipio: {
        [Op.in]: safeIds
      }
    }
  });

  juntas.forEach((junta) => {
    const municipioId = junta.IDMunicipio ?? junta.idmunicipio;
    if (!municipioId) return;
    counts.set(municipioId, (counts.get(municipioId) || 0) + 1);
  });

  return counts;
};

const getEdadesData = async ({ filtro = [] } = {}) => {
  const usuarios = await Usuario.findAll({ attributes: ["FechaNacimiento"] });
  const now = new Date();

  const ranges = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-60": 0,
    "60+": 0
  };

  usuarios.forEach((usuario) => {
    if (!usuario.FechaNacimiento) return;

    const nacimiento = new Date(usuario.FechaNacimiento);
    if (Number.isNaN(nacimiento.getTime())) return;

    let edad = now.getFullYear() - nacimiento.getFullYear();
    const monthDiff = now.getMonth() - nacimiento.getMonth();
    const dayDiff = now.getDate() - nacimiento.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) edad -= 1;

    if (edad <= 25) ranges["18-25"] += 1;
    else if (edad <= 35) ranges["26-35"] += 1;
    else if (edad <= 45) ranges["36-45"] += 1;
    else if (edad <= 60) ranges["46-60"] += 1;
    else ranges["60+"] += 1;
  });

  return filterByLabels(
    { labels: Object.keys(ranges), series: Object.values(ranges) },
    filtro
  );
};

const getComisionesData = async ({ filtro = [] } = {}) => {
  const mandatarios = await MandatarioJunta.findAll({
    include: [
      {
        model: Comisiones,
        as: "Comision",
        attributes: ["IDComision", "Nombre"],
        required: false
      }
    ]
  });

  const counts = {};
  mandatarios.forEach((mandatario) => {
    const nombre = mandatario.Comision?.Nombre || "Sin Comision";
    counts[nombre] = (counts[nombre] || 0) + 1;
  });

  const ordered = sortPairsByValueDesc(Object.entries(counts));
  return filterByLabels(
    {
      labels: ordered.map(([label]) => label),
      series: ordered.map(([, value]) => value)
    },
    filtro
  );
};

const getActivasData = async ({ estado = "" } = {}) => {
  const activas = await Junta.count({ where: { Activo: true } });
  const inactivas = await Junta.count({ where: { Activo: false } });

  const data = {
    labels: ["Activas", "Inactivas"],
    series: [activas, inactivas]
  };

  if (!estado) return data;
  return filterByLabels(data, [estado]);
};

const getCargosData = async ({ filtro = [] } = {}) => {
  const mandatarios = await MandatarioJunta.findAll({
    include: [
      {
        model: Cargo,
        attributes: ["IDCargo", "NombreCargo"],
        required: false
      }
    ]
  });

  const counts = {};
  mandatarios.forEach((mandatario) => {
    const nombre = mandatario.Cargo?.NombreCargo || "Sin Cargo";
    counts[nombre] = (counts[nombre] || 0) + 1;
  });

  const ordered = sortPairsByValueDesc(Object.entries(counts));
  return filterByLabels(
    {
      labels: ordered.map(([label]) => label),
      series: ordered.map(([, value]) => value)
    },
    filtro
  );
};

const getGeneroData = async ({ filtro = [] } = {}) => {
  const usuarios = await Usuario.findAll({ attributes: ["Sexo"] });
  const counts = {
    Masculino: 0,
    Femenino: 0,
    Otro: 0
  };

  usuarios.forEach((usuario) => {
    const sexo = normalizeText(usuario.Sexo || "");
    if (sexo === "MASCULINO" || sexo === "M") {
      counts.Masculino += 1;
    } else if (sexo === "FEMENINO" || sexo === "F") {
      counts.Femenino += 1;
    } else {
      counts.Otro += 1;
    }
  });

  return filterByLabels(
    {
      labels: Object.keys(counts),
      series: Object.values(counts)
    },
    filtro
  );
};

const getProvinciasData = async ({ provincias = [] } = {}) => {
  const structure = await getBoyacaStructure();
  if (!structure.provincias.length) {
    return {
      labels: [],
      series: [],
      municipios: [],
      detalle: []
    };
  }

  const municipioIds = structure.municipios.map((municipio) => getLugarId(municipio));
  const juntasByMunicipio = await countJuntasByMunicipioIds(municipioIds);

  const selectedProvincias = new Set(provincias.map(normalizeText));
  const hasProvinciaFilter = selectedProvincias.size > 0;

  const items = structure.provincias
    .map((provincia) => {
      const provinciaId = getLugarId(provincia);
      const provinciaName = getLugarNombre(provincia);
      const municipiosProvincia = structure.municipios.filter(
        (municipio) => getLugarParentId(municipio) === provinciaId
      );

      const detalle = municipiosProvincia
        .map((municipio) => {
          const municipioName = getLugarNombre(municipio);
          const municipioId = getLugarId(municipio);
          const juntas = juntasByMunicipio.get(municipioId) || 0;

          return {
            provincia: provinciaName,
            municipio: municipioName,
            juntas
          };
        })
        .sort((a, b) =>
          a.municipio.localeCompare(b.municipio, "es", { sensitivity: "base" })
        );

      const total = detalle.reduce((acc, item) => acc + item.juntas, 0);

      return {
        provincia: provinciaName,
        total,
        municipios: detalle.map((item) => item.municipio),
        detalle
      };
    })
    .filter(
      (item) =>
        !hasProvinciaFilter || selectedProvincias.has(normalizeText(item.provincia))
    )
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.provincia.localeCompare(b.provincia, "es", { sensitivity: "base" });
    });

  return {
    labels: items.map((item) => item.provincia),
    series: items.map((item) => item.total),
    municipios: items.map((item) => item.municipios),
    detalle: items.flatMap((item) => item.detalle)
  };
};

const getMunicipiosData = async ({ municipios = [] } = {}) => {
  const structure = await getBoyacaStructure();
  if (!structure.municipios.length) {
    return {
      labels: [],
      series: [],
      detalle: []
    };
  }

  const allMunicipioIds = structure.municipios.map((municipio) => getLugarId(municipio));
  const selectedIdsSet = new Set(municipios);

  const filteredMunicipios = selectedIdsSet.size
    ? structure.municipios.filter((municipio) =>
        selectedIdsSet.has(getLugarId(municipio))
      )
    : structure.municipios;

  const municipioIds = filteredMunicipios.map((municipio) => getLugarId(municipio));
  const juntasByMunicipio = await countJuntasByMunicipioIds(
    selectedIdsSet.size ? municipioIds : allMunicipioIds
  );

  const provinciasById = new Map(
    structure.provincias.map((provincia) => [getLugarId(provincia), getLugarNombre(provincia)])
  );

  const detalle = filteredMunicipios
    .map((municipio) => {
      const municipioId = getLugarId(municipio);
      const municipioName = getLugarNombre(municipio);
      const provinciaName = provinciasById.get(getLugarParentId(municipio)) || "";

      return {
        municipio: municipioName,
        provincia: provinciaName,
        juntas: juntasByMunicipio.get(municipioId) || 0
      };
    })
    .sort((a, b) => {
      if (b.juntas !== a.juntas) return b.juntas - a.juntas;
      return a.municipio.localeCompare(b.municipio, "es", { sensitivity: "base" });
    });

  return {
    labels: detalle.map((item) => item.municipio),
    series: detalle.map((item) => item.juntas),
    detalle
  };
};

const getReportData = async (tipo, query) => {
  const safeTipo = normalizeText(tipo).toLowerCase();
  const filtro = splitCsv(query?.filtro);
  const municipios = splitCsv(query?.municipios);
  const provincias = splitCsv(query?.provincias);
  const estado = query?.estado ? String(query.estado) : "";

  switch (safeTipo) {
    case "edades":
      return getEdadesData({ filtro });
    case "comisiones":
      return getComisionesData({ filtro });
    case "activas":
      return getActivasData({ estado });
    case "cargos":
      return getCargosData({ filtro });
    case "genero":
      return getGeneroData({ filtro });
    case "provincias":
      return getProvinciasData({ provincias });
    case "municipios":
      return getMunicipiosData({ municipios });
    default:
      throw new Error("Tipo de reporte no soportado");
  }
};

const buildTableData = (tipo, data) => {
  if (tipo === "provincias" && Array.isArray(data.detalle)) {
    return {
      headers: ["Provincia", "Municipio", "Juntas"],
      rows: data.detalle.map((item) => [item.provincia, item.municipio, item.juntas])
    };
  }

  if (tipo === "municipios" && Array.isArray(data.detalle)) {
    return {
      headers: ["Municipio", "Provincia", "Juntas"],
      rows: data.detalle.map((item) => [item.municipio, item.provincia, item.juntas])
    };
  }

  return {
    headers: ["Categoria", "Cantidad"],
    rows: (data.labels || []).map((label, index) => [label, data.series?.[index] ?? 0])
  };
};

const writeExcel = async (tipo, data) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte");
  const { headers, rows } = buildTableData(tipo, data);

  sheet.columns = headers.map((header, index) => ({
    header,
    key: `col${index}`,
    width: Math.max(18, header.length + 4)
  }));

  rows.forEach((rowValues) => {
    const row = {};
    rowValues.forEach((value, index) => {
      row[`col${index}`] = value;
    });
    sheet.addRow(row);
  });

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF009E76" }
  };

  sheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
        bottom: { style: "thin" }
      };

      if (rowNumber > 1) {
        cell.alignment = { vertical: "middle", horizontal: "left" };
      }
    });
  });

  return workbook.xlsx.writeBuffer();
};

const escapeRtf = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}");

const writeWordRtf = (tipo, data) => {
  const { headers, rows } = buildTableData(tipo, data);
  const title = getReportTitle(tipo);

  const lines = [];
  lines.push("{\\rtf1\\ansi\\deff0");
  lines.push("{\\fonttbl{\\f0 Arial;}}");
  lines.push(`\\f0\\fs28 \\b ${escapeRtf(title)} \\b0\\par`);
  lines.push(`\\fs20 ${escapeRtf(`Fecha: ${new Date().toLocaleDateString("es-CO")}`)}\\par\\par`);
  lines.push(`\\b ${headers.map((header) => escapeRtf(header)).join("\\tab ")} \\b0\\par`);
  rows.forEach((row) => {
    lines.push(`${row.map((cell) => escapeRtf(cell)).join("\\tab ")}\\par`);
  });
  lines.push("}");

  return Buffer.from(lines.join("\n"), "utf8");
};

const writePdf = (tipo, data) => {
  const { headers, rows } = buildTableData(tipo, data);
  const title = getReportTitle(tipo);

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const margin = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lineHeight = 14;
  let y = margin;

  const writeLine = (text, isHeader = false) => {
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    const wrapped = doc.splitTextToSize(String(text), maxWidth);

    wrapped.forEach((part) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(part, margin, y);
      y += lineHeight;
    });
  };

  doc.setFontSize(15);
  writeLine(title, true);
  y += 6;

  doc.setFontSize(10);
  writeLine(headers.join(" | "), true);
  y += 2;

  rows.forEach((row) => {
    writeLine(row.join(" | "));
  });

  return Buffer.from(doc.output("arraybuffer"));
};

export const reporteProvincias = async (req, res) => {
  try {
    const data = await getProvinciasData({
      provincias: splitCsv(req.query?.provincias)
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const reporteMunicipios = async (req, res) => {
  try {
    const data = await getMunicipiosData({
      municipios: splitCsv(req.query?.municipios)
    });

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const exportarReporte = async (req, res) => {
  const { tipo } = req.params;
  const format = String(req.query?.format || "").toLowerCase();

  if (!["excel", "word", "pdf"].includes(format)) {
    return res.status(400).json({ message: "Formato no soportado" });
  }

  try {
    const safeTipo = normalizeText(tipo).toLowerCase();
    const data = await getReportData(safeTipo, req.query || {});

    let buffer;
    let contentType;
    let extension;

    if (format === "excel") {
      buffer = await writeExcel(safeTipo, data);
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      extension = "xlsx";
    } else if (format === "word") {
      buffer = writeWordRtf(safeTipo, data);
      contentType = "application/rtf";
      extension = "rtf";
    } else {
      buffer = writePdf(safeTipo, data);
      contentType = "application/pdf";
      extension = "pdf";
    }

    const filename = `${sanitizeFilename(safeTipo)}-${new Date()
      .toISOString()
      .slice(0, 10)}.${extension}`;

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buffer);
  } catch (error) {
    if (error.message === "Tipo de reporte no soportado") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Error al generar el reporte", error: error.message });
  }
};
