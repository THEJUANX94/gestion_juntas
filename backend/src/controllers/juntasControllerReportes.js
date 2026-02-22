import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import { Op } from "sequelize";
import { imageToBase64, logoPath } from "../libs/imgabse64.js";
import { Cargo } from "../model/cargoModel.js";
import { Comisiones } from "../model/comisionModel.js";
import { Institucion } from "../model/institucionModel.js";
import { Junta } from "../model/juntaModel.js";
import { Lugar } from "../model/lugarModel.js";
import { MandatarioJunta } from "../model/mandatarioJuntaModel.js";
import { TipoJunta } from "../model/tipoJuntaModel.js";
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

const compareText = (a, b) =>
  String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" });

const sortByName = (items) =>
  [...items].sort((a, b) =>
    getLugarNombre(a).localeCompare(getLugarNombre(b), "es", { sensitivity: "base" })
  );

const sortPairsByValueDesc = (pairs) =>
  [...pairs].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return compareText(a[0], b[0]);
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
        .sort((a, b) => compareText(a.municipio, b.municipio));

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
      return compareText(a.provincia, b.provincia);
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
      return compareText(a.municipio, b.municipio);
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

const JUNTA_EXPORT_INCLUDE = [
  {
    model: Lugar,
    attributes: ["IDLugar", "NombreLugar", "IDOtroLugar"],
    required: false,
    include: [
      {
        model: Lugar,
        as: "LugarPadre",
        attributes: ["IDLugar", "NombreLugar"],
        required: false
      }
    ]
  },
  {
    model: TipoJunta,
    attributes: ["IDTipoJuntas", "NombreTipoJunta"],
    required: false
  },
  {
    model: Institucion,
    attributes: ["IDInstitucion", "NombreInstitucion"],
    required: false
  }
];

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = () =>
  new Date().toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

const getTipoJuntaNombre = (junta) =>
  junta?.TipoJuntum?.NombreTipoJunta || junta?.TipoJunta?.NombreTipoJunta || "";

const getJuntaInfo = (junta = {}) => ({
  id: junta?.IDJunta ?? junta?.idjunta ?? "",
  razonSocial: junta?.RazonSocial ?? "",
  direccion: junta?.Direccion ?? "",
  personeria: junta?.NumPersoneriaJuridica ?? "",
  municipio: junta?.Lugar?.NombreLugar ?? "",
  provincia: junta?.Lugar?.LugarPadre?.NombreLugar ?? "",
  tipoJunta: getTipoJuntaNombre(junta),
  institucion: junta?.Institucion?.NombreInstitucion ?? "",
  zona: junta?.Zona ?? "",
  estado: junta?.Activo ? "Activa" : "Inactiva",
  fechaCreacion: formatDate(junta?.FechaCreacion),
  fechaInicioPeriodo: formatDate(junta?.FechaInicioPeriodo),
  fechaFinPeriodo: formatDate(junta?.FechaFinPeriodo),
  fechaAsamblea: formatDate(junta?.FechaAsamblea),
  correo: junta?.Correo ?? ""
});

const getNombrePersona = (usuario = {}) =>
  [
    usuario?.PrimerNombre,
    usuario?.SegundoNombre,
    usuario?.PrimerApellido,
    usuario?.SegundoApellido
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

const getAgeRangeFromDate = (fechaNacimiento) => {
  if (!fechaNacimiento) return null;

  const now = new Date();
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;

  let edad = now.getFullYear() - nacimiento.getFullYear();
  const monthDiff = now.getMonth() - nacimiento.getMonth();
  const dayDiff = now.getDate() - nacimiento.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) edad -= 1;

  if (edad <= 25) return "18-25";
  if (edad <= 35) return "26-35";
  if (edad <= 45) return "36-45";
  if (edad <= 60) return "46-60";
  return "60+";
};

const getGeneroNombre = (sexo = "") => {
  const normalized = normalizeText(sexo);
  if (normalized === "MASCULINO" || normalized === "M") return "Masculino";
  if (normalized === "FEMENINO" || normalized === "F") return "Femenino";
  return "Otro";
};

const loadJuntasForExport = async (where = {}) =>
  Junta.findAll({
    where,
    include: JUNTA_EXPORT_INCLUDE,
    order: [["RazonSocial", "ASC"]]
  });

const sortByJuntaLocation = (left, right) => {
  const a = getJuntaInfo(left.junta || left);
  const b = getJuntaInfo(right.junta || right);
  return (
    compareText(a.provincia, b.provincia) ||
    compareText(a.municipio, b.municipio) ||
    compareText(a.razonSocial, b.razonSocial)
  );
};

const buildFilterSubtitle = (prefix, values, fallback) =>
  `${prefix}: ${values.length ? values.join(", ") : fallback}`;

const buildEdadesExportDataset = async ({ filtro = [] } = {}) => {
  const data = await getEdadesData({ filtro });
  const total = (data.series || []).reduce((acc, value) => acc + Number(value || 0), 0);
  const rows = (data.labels || []).map((label, index) => {
    const cantidad = Number(data.series?.[index] || 0);
    const porcentaje = total > 0 ? `${((cantidad / total) * 100).toFixed(2)}%` : "0.00%";
    return [label, cantidad, porcentaje];
  });

  return {
    title: getReportTitle("edades"),
    subtitle: buildFilterSubtitle("Filtro aplicado", filtro, "Todos los rangos"),
    headers: ["Rango de Edad", "Cantidad", "Porcentaje"],
    rows
  };
};

const buildComisionesExportDataset = async ({ filtro = [] } = {}) => {
  const selected = new Set(filtro.map(normalizeText));
  const hasFilter = selected.size > 0;
  const wantsSinComision = selected.has("SIN COMISION");

  const registros = await MandatarioJunta.findAll({
    attributes: ["NumeroIdentificacion", "IDJunta", "IDComision"],
    include: [
      {
        model: Comisiones,
        as: "Comision",
        attributes: ["IDComision", "Nombre"],
        required: false
      },
      {
        model: Junta,
        required: false,
        include: JUNTA_EXPORT_INCLUDE
      }
    ]
  });

  const grouped = new Map();

  registros.forEach((registro) => {
    if (!registro.Junta) return;

    const comisionNombre = registro.Comision?.Nombre || "Sin Comision";
    const normalizedComision = normalizeText(comisionNombre);

    if (hasFilter) {
      if (!registro.Comision && !wantsSinComision) return;
      if (registro.Comision && !selected.has(normalizedComision)) return;
    }

    const info = getJuntaInfo(registro.Junta);
    const municipio = info.municipio || "Sin Municipio";
    const provincia = info.provincia || "Sin Provincia";
    const key = `${comisionNombre}|||${provincia}|||${municipio}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        comision: comisionNombre,
        provincia,
        municipio,
        juntas: new Set(),
        personas: 0
      });
    }

    const current = grouped.get(key);
    const juntaId = registro.Junta.IDJunta ?? registro.Junta.idjunta;
    if (juntaId) current.juntas.add(juntaId);
    current.personas += 1;
  });

  const groupedByComision = new Map();
  Array.from(grouped.values()).forEach((item) => {
    if (!groupedByComision.has(item.comision)) {
      groupedByComision.set(item.comision, {
        personas: 0,
        juntas: new Set(),
        ubicaciones: []
      });
    }

    const current = groupedByComision.get(item.comision);
    current.personas += item.personas;
    item.juntas.forEach((juntaId) => current.juntas.add(juntaId));
    current.ubicaciones.push(item);
  });

  const orderedComisiones = Array.from(groupedByComision.entries()).sort((a, b) => {
    if (b[1].personas !== a[1].personas) return b[1].personas - a[1].personas;
    return compareText(a[0], b[0]);
  });

  const rows = [];
  orderedComisiones.forEach(([comision, stats]) => {
    rows.push([
      comision || "Sin Comision",
      "TOTAL COMISION",
      stats.personas,
      stats.juntas.size,
      "",
      ""
    ]);

    stats.ubicaciones
      .sort((a, b) => {
        if (b.personas !== a.personas) return b.personas - a.personas;
        if (b.juntas.size !== a.juntas.size) return b.juntas.size - a.juntas.size;
        return compareText(a.provincia, b.provincia) || compareText(a.municipio, b.municipio);
      })
      .forEach((item) => {
        rows.push([
          comision || "Sin Comision",
          "UBICACION",
          item.personas,
          item.juntas.size,
          item.provincia,
          item.municipio
        ]);
      });
  });

  return {
    title: getReportTitle("comisiones"),
    subtitle: buildFilterSubtitle("Filtro aplicado", filtro, "Todas las comisiones"),
    headers: [
      "Comision",
      "Tipo Registro",
      "Participantes",
      "Juntas",
      "Provincia",
      "Municipio"
    ],
    rows
  };
};

const parseEstadoFilter = (estado = "") => {
  const normalized = normalizeText(estado);
  if (normalized === "ACTIVA" || normalized === "ACTIVAS") return true;
  if (normalized === "INACTIVA" || normalized === "INACTIVAS") return false;
  return null;
};

const buildActivasExportDataset = async ({ estado = "" } = {}) => {
  const parsedEstado = parseEstadoFilter(estado);
  const where = parsedEstado === null ? {} : { Activo: parsedEstado };
  const juntas = await loadJuntasForExport(where);

  const rows = juntas.map((junta) => {
    const info = getJuntaInfo(junta);
    return [
      info.estado,
      info.razonSocial,
      info.direccion,
      info.personeria,
      info.municipio || "Sin Municipio",
      info.provincia || "Sin Provincia",
      info.tipoJunta,
      info.institucion,
      info.zona,
      info.fechaInicioPeriodo,
      info.fechaFinPeriodo
    ];
  });

  let estadoTexto = "Todas (Activas e Inactivas)";
  if (parsedEstado === true) estadoTexto = "Solo Activas";
  if (parsedEstado === false) estadoTexto = "Solo Inactivas";

  return {
    title: getReportTitle("activas"),
    subtitle: `Filtro aplicado: ${estadoTexto}`,
    headers: [
      "Estado",
      "Junta",
      "Direccion",
      "Personeria Juridica",
      "Municipio",
      "Provincia",
      "Tipo de Junta",
      "Institucion",
      "Zona",
      "Inicio Periodo",
      "Fin Periodo"
    ],
    rows
  };
};

const buildCargosExportDataset = async ({ filtro = [] } = {}) => {
  const selected = new Set(filtro.map(normalizeText));
  const hasFilter = selected.size > 0;
  const wantsSinCargo = selected.has("SIN CARGO");

  const registros = await MandatarioJunta.findAll({
    attributes: [
      "NumeroIdentificacion",
      "IDJunta",
      "IDCargo",
      "Residencia",
      "Expedido"
    ],
    include: [
      {
        model: Cargo,
        attributes: ["IDCargo", "NombreCargo"],
        required: false
      },
      {
        model: Usuario,
        attributes: [
          "NumeroIdentificacion",
          "PrimerNombre",
          "SegundoNombre",
          "PrimerApellido",
          "SegundoApellido"
        ],
        required: false
      },
      {
        model: Lugar,
        as: "LugarExpedido",
        attributes: ["IDLugar", "NombreLugar"],
        required: false
      },
      {
        model: Junta,
        required: false,
        include: JUNTA_EXPORT_INCLUDE
      }
    ]
  });

  if (!hasFilter) {
    const grouped = new Map();
    const totalJuntas = new Set();
    let totalPersonas = 0;

    registros.forEach((registro) => {
      if (!registro.Junta) return;
      const cargoNombre = registro.Cargo?.NombreCargo || "Sin Cargo";
      if (!grouped.has(cargoNombre)) {
        grouped.set(cargoNombre, { personas: 0, juntas: new Set() });
      }

      const current = grouped.get(cargoNombre);
      current.personas += 1;
      totalPersonas += 1;

      const juntaId = registro.Junta.IDJunta ?? registro.Junta.idjunta;
      if (juntaId) {
        current.juntas.add(juntaId);
        totalJuntas.add(juntaId);
      }
    });

    const rows = Array.from(grouped.entries())
      .sort((a, b) => {
        if (b[1].personas !== a[1].personas) return b[1].personas - a[1].personas;
        return compareText(a[0], b[0]);
      })
      .map(([cargo, stats]) => {
        const porcentaje = totalPersonas > 0
          ? `${((stats.personas / totalPersonas) * 100).toFixed(2)}%`
          : "0.00%";
        return [cargo, stats.personas, stats.juntas.size, porcentaje];
      });

    rows.push([
      "TOTAL GENERAL",
      totalPersonas,
      totalJuntas.size,
      totalPersonas > 0 ? "100.00%" : "0.00%"
    ]);

    return {
      title: getReportTitle("cargos"),
      subtitle: "Filtro aplicado: Todos los cargos (estadistica general)",
      headers: ["Cargo", "Personas", "Juntas", "Porcentaje"],
      rows
    };
  }

  const filtered = registros.filter((registro) => {
    if (!registro.Junta) return false;
    const cargoNombre = registro.Cargo?.NombreCargo || "Sin Cargo";
    const normalizedCargo = normalizeText(cargoNombre);
    if (!registro.Cargo) return wantsSinCargo;
    return selected.has(normalizedCargo);
  });

  const rows = filtered
    .sort((a, b) => {
      const cargoA = a.Cargo?.NombreCargo || "Sin Cargo";
      const cargoB = b.Cargo?.NombreCargo || "Sin Cargo";
      const infoA = getJuntaInfo(a.Junta);
      const infoB = getJuntaInfo(b.Junta);
      const nombreA = getNombrePersona(a.Usuario) || a.NumeroIdentificacion || "";
      const nombreB = getNombrePersona(b.Usuario) || b.NumeroIdentificacion || "";
      return (
        compareText(cargoA, cargoB) ||
        compareText(infoA.provincia, infoB.provincia) ||
        compareText(infoA.municipio, infoB.municipio) ||
        compareText(infoA.razonSocial, infoB.razonSocial) ||
        compareText(nombreA, nombreB)
      );
    })
    .map((registro) => {
      const info = getJuntaInfo(registro.Junta);
      const nombrePersona = getNombrePersona(registro.Usuario) || "Sin nombre";
      return [
        registro.Cargo?.NombreCargo || "Sin Cargo",
        registro.NumeroIdentificacion || "",
        nombrePersona,
        registro.Residencia || "",
        registro.LugarExpedido?.NombreLugar || "",
        info.razonSocial,
        info.municipio || "Sin Municipio",
        info.provincia || "Sin Provincia",
        info.estado,
        info.fechaInicioPeriodo,
        info.fechaFinPeriodo
      ];
    });

  return {
    title: getReportTitle("cargos"),
    subtitle: buildFilterSubtitle("Filtro aplicado", filtro, "Todos los cargos (detalle de personas)"),
    headers: [
      "Cargo",
      "Documento",
      "Persona",
      "Residencia",
      "Lugar de Expedicion",
      "Junta",
      "Municipio",
      "Provincia",
      "Estado Junta",
      "Inicio Periodo",
      "Fin Periodo"
    ],
    rows
  };
};

const buildGeneroExportDataset = async ({ filtro = [] } = {}) => {
  const data = await getGeneroData({ filtro });
  const total = (data.series || []).reduce((acc, value) => acc + Number(value || 0), 0);
  const rows = (data.labels || []).map((label, index) => {
    const cantidad = Number(data.series?.[index] || 0);
    const porcentaje = total > 0 ? `${((cantidad / total) * 100).toFixed(2)}%` : "0.00%";
    return [label, cantidad, porcentaje];
  });

  return {
    title: getReportTitle("genero"),
    subtitle: buildFilterSubtitle("Filtro aplicado", filtro, "Todos los generos"),
    headers: ["Genero", "Cantidad", "Porcentaje"],
    rows
  };
};

const buildProvinciasExportDataset = async ({ provincias = [] } = {}) => {
  const selected = new Set(provincias.map(normalizeText));
  const hasFilter = selected.size > 0;

  const juntas = await loadJuntasForExport();

  const filtered = juntas.filter((junta) => {
    const info = getJuntaInfo(junta);
    const provincia = info.provincia || "Sin Provincia";
    return !hasFilter || selected.has(normalizeText(provincia));
  });

  const totalsByProvincia = new Map();
  filtered.forEach((junta) => {
    const info = getJuntaInfo(junta);
    const provincia = info.provincia || "Sin Provincia";
    totalsByProvincia.set(provincia, (totalsByProvincia.get(provincia) || 0) + 1);
  });

  const rows = filtered
    .sort((a, b) => sortByJuntaLocation({ junta: a }, { junta: b }))
    .map((junta) => {
      const info = getJuntaInfo(junta);
      const provincia = info.provincia || "Sin Provincia";
      return [
        provincia,
        totalsByProvincia.get(provincia) || 0,
        info.municipio || "Sin Municipio",
        info.razonSocial,
        info.tipoJunta,
        info.institucion,
        info.estado,
        info.fechaInicioPeriodo,
        info.fechaFinPeriodo
      ];
    });

  const seenProvincias = new Set();
  const rowsWithSingleTotal = rows.map((row) => {
    const provincia = row[0];
    if (seenProvincias.has(provincia)) {
      return [row[0], "", ...row.slice(2)];
    }
    seenProvincias.add(provincia);
    return row;
  });

  return {
    title: getReportTitle("provincias"),
    subtitle: buildFilterSubtitle("Filtro aplicado", provincias, "Todas las provincias"),
    headers: [
      "Provincia",
      "Total Juntas Provincia",
      "Municipio",
      "Junta",
      "Tipo de Junta",
      "Institucion",
      "Estado",
      "Inicio Periodo",
      "Fin Periodo"
    ],
    rows: rowsWithSingleTotal
  };
};

const buildMunicipiosExportDataset = async ({ municipios = [] } = {}) => {
  const safeMunicipioIds = [...new Set(municipios.filter(Boolean))];
  const where = safeMunicipioIds.length
    ? {
        IDMunicipio: {
          [Op.in]: safeMunicipioIds
        }
      }
    : {};

  const juntas = await loadJuntasForExport(where);

  const totalsByMunicipio = new Map();
  juntas.forEach((junta) => {
    const info = getJuntaInfo(junta);
    const municipio = info.municipio || "Sin Municipio";
    totalsByMunicipio.set(municipio, (totalsByMunicipio.get(municipio) || 0) + 1);
  });

  const rows = juntas
    .sort((a, b) => {
      const infoA = getJuntaInfo(a);
      const infoB = getJuntaInfo(b);
      return (
        compareText(infoA.municipio, infoB.municipio) ||
        compareText(infoA.razonSocial, infoB.razonSocial)
      );
    })
    .map((junta) => {
      const info = getJuntaInfo(junta);
      const municipio = info.municipio || "Sin Municipio";
      return [
        municipio,
        info.provincia || "Sin Provincia",
        totalsByMunicipio.get(municipio) || 0,
        info.razonSocial,
        info.tipoJunta,
        info.institucion,
        info.estado,
        info.fechaInicioPeriodo,
        info.fechaFinPeriodo
      ];
    });

  const seenMunicipios = new Set();
  const rowsWithSingleTotal = rows.map((row) => {
    const municipio = row[0];
    if (seenMunicipios.has(municipio)) {
      return [row[0], row[1], "", ...row.slice(3)];
    }
    seenMunicipios.add(municipio);
    return row;
  });

  return {
    title: getReportTitle("municipios"),
    subtitle: safeMunicipioIds.length
      ? `Filtro aplicado: ${safeMunicipioIds.length} municipio(s) seleccionados`
      : "Filtro aplicado: Todos los municipios",
    headers: [
      "Municipio",
      "Provincia",
      "Total Juntas Municipio",
      "Junta",
      "Tipo de Junta",
      "Institucion",
      "Estado",
      "Inicio Periodo",
      "Fin Periodo"
    ],
    rows: rowsWithSingleTotal
  };
};

const getExportDataset = async (tipo, query) => {
  const safeTipo = normalizeText(tipo).toLowerCase();
  const filtro = splitCsv(query?.filtro);
  const municipios = splitCsv(query?.municipios);
  const provincias = splitCsv(query?.provincias);
  const estado = query?.estado ? String(query.estado) : "";

  switch (safeTipo) {
    case "edades":
      return buildEdadesExportDataset({ filtro });
    case "comisiones":
      return buildComisionesExportDataset({ filtro });
    case "activas":
      return buildActivasExportDataset({ estado });
    case "cargos":
      return buildCargosExportDataset({ filtro });
    case "genero":
      return buildGeneroExportDataset({ filtro });
    case "provincias":
      return buildProvinciasExportDataset({ provincias });
    case "municipios":
      return buildMunicipiosExportDataset({ municipios });
    default:
      throw new Error("Tipo de reporte no soportado");
  }
};

const toExcelColumnName = (index) => {
  let value = index;
  let columnName = "";
  while (value > 0) {
    const modulo = (value - 1) % 26;
    columnName = String.fromCharCode(65 + modulo) + columnName;
    value = Math.floor((value - modulo) / 26);
  }
  return columnName || "A";
};

const writeExcel = async (dataset) => {
  const headers = dataset.headers?.length ? dataset.headers : ["Detalle"];
  const rows = dataset.rows?.length
    ? dataset.rows
    : [[`Sin registros para ${dataset.title || "este reporte"}`]];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte", {
    views: [{ state: "frozen", ySplit: 4 }]
  });

  const totalColumns = headers.length;
  const lastColumn = toExcelColumnName(totalColumns);

  sheet.mergeCells(`A1:${lastColumn}1`);
  sheet.getCell("A1").value = dataset.title || "Reporte";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF009E76" }
  };
  sheet.getRow(1).height = 26;

  sheet.mergeCells(`A2:${lastColumn}2`);
  sheet.getCell("A2").value = dataset.subtitle || "";
  sheet.getCell("A2").font = { italic: true, size: 11, color: { argb: "FF444444" } };
  sheet.getCell("A2").alignment = { vertical: "middle", horizontal: "left", wrapText: true };
  sheet.getRow(2).height = 24;

  sheet.mergeCells(`A3:${lastColumn}3`);
  sheet.getCell("A3").value = `Fecha de generacion: ${formatDateTime()}`;
  sheet.getCell("A3").font = { size: 10, color: { argb: "FF666666" } };
  sheet.getCell("A3").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(3).height = 18;

  headers.forEach((header, index) => {
    const cell = sheet.getCell(4, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF005F4B" }
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFFFFFFF" } },
      left: { style: "thin", color: { argb: "FFFFFFFF" } },
      right: { style: "thin", color: { argb: "FFFFFFFF" } },
      bottom: { style: "thin", color: { argb: "FFFFFFFF" } }
    };
  });
  sheet.getRow(4).height = 22;

  rows.forEach((rowValues, rowIndex) => {
    const rowNumber = 5 + rowIndex;
    rowValues.forEach((value, columnIndex) => {
      const cell = sheet.getCell(rowNumber, columnIndex + 1);
      cell.value = value ?? "";
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD6D6D6" } },
        left: { style: "thin", color: { argb: "FFD6D6D6" } },
        right: { style: "thin", color: { argb: "FFD6D6D6" } },
        bottom: { style: "thin", color: { argb: "FFD6D6D6" } }
      };
      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF7F9F8" }
        };
      }
    });
  });

  headers.forEach((header, index) => {
    const maxDataLength = rows.reduce((max, row) => {
      const value = row[index] ?? "";
      return Math.max(max, String(value).length);
    }, String(header).length);

    const desiredWidth = Math.min(60, Math.max(16, maxDataLength + 3));
    sheet.getColumn(index + 1).width = desiredWidth;
  });

  sheet.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4, column: totalColumns }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const getLogoBase64Safe = async () => {
  try {
    return await imageToBase64(logoPath);
  } catch (_error) {
    return "";
  }
};

const toLogoHex = (base64Data = "") => {
  if (!base64Data) return "";
  const rawBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  if (!rawBase64) return "";
  return Buffer.from(rawBase64, "base64").toString("hex").toUpperCase();
};

const escapeRtf = (value = "") =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\r\n|\n|\r/g, "\\line ")
    .replace(/[^\x00-\x7F]/g, (char) => `\\u${char.charCodeAt(0)}?`);

const writeWordRtf = async (dataset) => {
  const headers = dataset.headers?.length ? dataset.headers : ["Detalle"];
  const rows = dataset.rows?.length
    ? dataset.rows
    : [[`Sin registros para ${dataset.title || "este reporte"}`]];

  const logoBase64 = await getLogoBase64Safe();
  const logoHex = toLogoHex(logoBase64);

  const lines = [];
  lines.push("{\\rtf1\\ansi\\ansicpg1252\\deff0");
  lines.push("{\\fonttbl{\\f0 Calibri;\\f1 Arial;}}");
  lines.push(
    "{\\colortbl ;\\red0\\green0\\blue0;\\red200\\green200\\blue200;\\red0\\green94\\blue73;\\red225\\green225\\blue225;\\red245\\green247\\blue246;}"
  );
  lines.push("\\paperw11906\\paperh16838\\margl720\\margr720\\margt720\\margb720");

  // Marca de agua textual institucional.
  lines.push(`{\\pard\\qc\\cf4\\fs84\\i ${escapeRtf("GOBERNACION DE BOYACA")}\\i0\\par}`);

  if (logoHex) {
    lines.push(`{\\pard\\qc{\\pict\\pngblip\\picw600\\pich600\\picwgoal950\\pichgoal950 ${logoHex}}\\par}`);
  }

  lines.push(`{\\pard\\qc\\cf2\\fs64\\b ${escapeRtf("GOBERNACION DE BOYACA")}\\b0\\par}`);
  lines.push(`{\\pard\\qc\\cf3\\fs36\\b ${escapeRtf(dataset.title || "Reporte")}\\b0\\par}`);

  if (dataset.subtitle) {
    lines.push(`{\\pard\\qc\\fs22 ${escapeRtf(dataset.subtitle)}\\par}`);
  }
  lines.push(`{\\pard\\qc\\fs20 ${escapeRtf(`Fecha de generacion: ${formatDateTime()}`)}\\par}`);
  lines.push("{\\pard\\sa220\\par}");

  const useTableLayout = headers.length <= 8;

  if (useTableLayout) {
    const tableWidthTwips = 10466; // Ancho util aproximado en A4 con margenes definidos.
    const colWidth = Math.max(900, Math.floor(tableWidthTwips / headers.length));

    const buildRow = (cells, isHeader = false) => {
      const safeCells = headers.map((_, idx) => escapeRtf(String(cells?.[idx] ?? "")));
      const cellDefs = [];
      const cellValues = [];
      let x = 0;

      safeCells.forEach((cell) => {
        x += colWidth;
        cellDefs.push(
          isHeader
            ? "\\clcbpat5\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10"
            : "\\clbrdrt\\brdrs\\brdrw10\\clbrdrl\\brdrs\\brdrw10\\clbrdrb\\brdrs\\brdrw10\\clbrdrr\\brdrs\\brdrw10"
        );
        cellDefs.push(`\\cellx${x}`);
        cellValues.push(isHeader ? `\\intbl\\b ${cell}\\b0\\cell` : `\\intbl ${cell}\\cell`);
      });

      lines.push(`{\\trowd\\trgaph60${cellDefs.join("")}${cellValues.join("")}\\row}`);
    };

    buildRow(headers, true);
    rows.forEach((row) => buildRow(row, false));
  } else {
    // Para tablas muy anchas se usa formato por bloques para legibilidad.
    rows.forEach((row, rowIndex) => {
      lines.push(`{\\pard\\sa70\\b Registro ${rowIndex + 1}\\b0\\par}`);
      headers.forEach((header, colIndex) => {
        const value = row?.[colIndex] ?? "";
        if (value === "") return;
        lines.push(`{\\pard\\li240\\sa35\\b ${escapeRtf(header)}:\\b0 ${escapeRtf(String(value))}\\par}`);
      });
      lines.push("{\\pard\\sa120\\par}");
    });
  }

  lines.push("}");
  return Buffer.from(lines.join("\n"), "utf8");
};

const getPdfColumnWidths = (headers, rows, tableWidth) => {
  const sampleRows = rows.slice(0, 40);
  const weights = headers.map((header, index) => {
    let maxLen = String(header || "").length;
    sampleRows.forEach((row) => {
      const cellLength = String(row?.[index] ?? "").slice(0, 120).length;
      if (cellLength > maxLen) maxLen = cellLength;
    });
    return Math.max(8, Math.min(maxLen, 36));
  });

  const sum = weights.reduce((acc, current) => acc + current, 0) || headers.length;
  return weights.map((weight) => (weight / sum) * tableWidth);
};

const writePdf = async (dataset) => {
  const headers = dataset.headers?.length ? dataset.headers : ["Detalle"];
  const rows = dataset.rows?.length
    ? dataset.rows
    : [[`Sin registros para ${dataset.title || "este reporte"}`]];

  const orientation = headers.length > 8 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const logoBase64 = await getLogoBase64Safe();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 8;
  const tableWidth = pageWidth - margin * 2;
  const columnWidths = getPdfColumnWidths(headers, rows, tableWidth);
  const rowLineHeight = 3.8;

  let y = 0;
  
  const drawWatermark = () => {
    doc.setTextColor(232, 232, 232);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(34);
    doc.text("GOBERNACION DE BOYACA", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 35
    });
    doc.setTextColor(0, 0, 0);
  };

  const getCellLines = (cells) =>
    headers.map((_, colIndex) =>
      doc.splitTextToSize(
        String(cells?.[colIndex] ?? ""),
        Math.max(4, columnWidths[colIndex] - 2)
      )
    );

  const drawHeaderRow = () => {
    const headerLines = getCellLines(headers);
    const headerLineCount = Math.max(...headerLines.map((lines) => lines.length), 1);
    const headerHeight = headerLineCount * rowLineHeight + 2;

    doc.setFillColor(0, 94, 73);
    doc.rect(margin, y, tableWidth, headerHeight, "F");

    let x = margin;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    headers.forEach((header, colIndex) => {
      const lines = doc.splitTextToSize(String(header), Math.max(4, columnWidths[colIndex] - 2));
      doc.rect(x, y, columnWidths[colIndex], headerHeight);
      doc.text(lines, x + 1, y + 3.5);
      x += columnWidths[colIndex];
    });

    doc.setTextColor(0, 0, 0);
    y += headerHeight;
  };

  const drawPageHeader = () => {
    drawWatermark();

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", margin, 8, 16, 16);
      } catch (_error) {
        // Ignora problemas con el logo para no romper la descarga.
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("GOBERNACION DE BOYACA", margin + 20, 13);

    doc.setFontSize(9);
    doc.text("Secretaria de Gobierno y Accion Comunal", margin + 20, 17);

    doc.setFontSize(13);
    doc.text(dataset.title || "Reporte", pageWidth / 2, 24, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);

    const subtitleLines = dataset.subtitle
      ? doc.splitTextToSize(dataset.subtitle, Math.max(40, tableWidth - 10))
      : [];
    if (subtitleLines.length) {
      doc.text(subtitleLines, pageWidth / 2, 28, { align: "center" });
    }

    const subtitleHeight = subtitleLines.length ? subtitleLines.length * rowLineHeight : 0;
    const dateY = 30 + subtitleHeight;
    const lineY = 33 + subtitleHeight;

    doc.text(`Fecha de generacion: ${formatDateTime()}`, pageWidth / 2, dateY, {
      align: "center"
    });

    doc.setDrawColor(0, 158, 118);
    doc.setLineWidth(0.4);
    doc.line(margin, lineY, pageWidth - margin, lineY);

    y = lineY + 3;
    drawHeaderRow();
  };

  const drawDataRow = (cells, rowIndex) => {
    const cellLines = getCellLines(cells);
    const lineCount = Math.max(...cellLines.map((lines) => lines.length), 1);
    const rowHeight = lineCount * rowLineHeight + 2;

    if (y + rowHeight > pageHeight - margin) {
      doc.addPage();
      drawPageHeader();
    }

    if (rowIndex % 2 === 0) {
      doc.setFillColor(246, 249, 248);
      doc.rect(margin, y, tableWidth, rowHeight, "F");
    }

    let x = margin;
    doc.setDrawColor(216, 223, 220);
    doc.setLineWidth(0.2);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.6);

    headers.forEach((_, colIndex) => {
      doc.rect(x, y, columnWidths[colIndex], rowHeight);
      doc.text(cellLines[colIndex], x + 1, y + 3.2);
      x += columnWidths[colIndex];
    });

    y += rowHeight;
  };

  drawPageHeader();
  rows.forEach((row, index) => drawDataRow(row, index));

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

    // Se mantiene la validacion de tipos usando la misma logica del backend.
    await getReportData(safeTipo, req.query || {});
    const dataset = await getExportDataset(safeTipo, req.query || {});

    let buffer;
    let contentType;
    let extension;

    if (format === "excel") {
      buffer = await writeExcel(dataset);
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      extension = "xlsx";
    } else if (format === "word") {
      buffer = await writeWordRtf(dataset);
      contentType = "application/rtf";
      extension = "rtf";
    } else {
      buffer = await writePdf(dataset);
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

    return res.status(500).json({
      message: "Error al generar el reporte",
      error: error.message
    });
  }
};
