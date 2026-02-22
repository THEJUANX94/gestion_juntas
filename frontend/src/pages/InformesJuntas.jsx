import { useEffect, useState } from "react";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import { Download, FileSpreadsheet, FileText, FileType, Filter, RotateCcw } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";
import Footer from "../components/ui/Footer";

const VITE_PATH =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_PATH
    ? import.meta.env.VITE_PATH
    : "";

const apiFetch = (path, opts = {}) =>
  fetch(`${VITE_PATH}${path}`, { credentials: "include", ...opts });

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const getLugarId = (lugar) => lugar?.IDLugar ?? lugar?.idlugar ?? null;
const getParentId = (lugar) => lugar?.IDOtroLugar ?? lugar?.idotrolugar ?? null;
const getLugarNombre = (lugar) => lugar?.NombreLugar ?? lugar?.nombrelugar ?? "";
const getLugarTipo = (lugar) => lugar?.TipoLugar ?? lugar?.tipolugar ?? "";

const routeMap = {
  ages: "edades",
  commissions: "comisiones",
  active: "activas",
  positions: "cargos",
  gender: "genero",
  province: "provincias",
  municipality: "municipios"
};

const tabs = [
  { key: "ages", label: "Por Edades" },
  { key: "commissions", label: "Comisiones" },
  { key: "active", label: "Activas" },
  { key: "positions", label: "Cargos" },
  { key: "gender", label: "Genero" },
  { key: "province", label: "Provincias" },
  { key: "municipality", label: "Municipio" }
];

const BarChart = ({ labels = [], series = [], color = "bg-green-600" }) => {
  if (!labels.length) return <p className="mt-3 text-sm text-gray-400">Sin datos para mostrar</p>;
  const max = Math.max(...series, 1);

  return (
    <div className="mt-3 space-y-2">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-56 truncate text-sm text-gray-700" title={label}>
            {label}
          </div>
          <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100">
            <div style={{ width: `${(series[i] / max) * 100}%` }} className={`h-6 ${color}`} />
          </div>
          <div className="w-12 text-right text-sm font-semibold">{series[i]}</div>
        </div>
      ))}
    </div>
  );
};

const DownloadButtons = ({ onDownload, compact = false }) => (
  <div className={`flex flex-wrap gap-2 ${compact ? "mt-2" : "mt-5 border-t pt-4"}`}>
    <button
      onClick={() => onDownload("excel")}
      className={`inline-flex items-center gap-2 rounded-lg bg-green-700 text-white hover:bg-green-800 ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      <FileSpreadsheet size={compact ? 14 : 16} />
      Excel
    </button>
    <button
      onClick={() => onDownload("word")}
      className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      <FileText size={compact ? 14 : 16} />
      Word
    </button>
    <button
      onClick={() => onDownload("pdf")}
      className={`inline-flex items-center gap-2 rounded-lg bg-red-600 text-white hover:bg-red-700 ${
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"
      }`}
    >
      <FileType size={compact ? 14 : 16} />
      PDF
    </button>
  </div>
);

const Table = ({ headers, rows }) => (
  <div className="mt-4 overflow-auto">
    <table className="min-w-full border-collapse text-sm">
      <thead>
        <tr className="bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white">
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
            {row.map((cell, j) => (
              <td key={`${i}-${j}`} className="border px-4 py-2">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function InformesJuntas() {
  const [selectedReport, setSelectedReport] = useState("ages");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [agesData, setAgesData] = useState(null);
  const [commissionsData, setCommissionsData] = useState(null);
  const [activeData, setActiveData] = useState(null);
  const [positionsData, setPositionsData] = useState(null);
  const [genderData, setGenderData] = useState(null);
  const [provinceData, setProvinceData] = useState(null);
  const [municipalityData, setMunicipalityData] = useState(null);

  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [modalProvince, setModalProvince] = useState(null);

  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [selectedCommission, setSelectedCommission] = useState("");
  const [selectedActiveState, setSelectedActiveState] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  useEffect(() => {
    apiFetch("/lugares")
      .then((r) => (r.ok ? r.json() : Promise.reject("Error cargando lugares")))
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        const deptoBoyaca = lista.find(
          (lugar) =>
            normalizeText(getLugarTipo(lugar)) === "DEPARTAMENTO" &&
            normalizeText(getLugarNombre(lugar)) === "BOYACA"
        );

        if (!deptoBoyaca) {
          setProvincias([]);
          setMunicipios([]);
          setError("No se encontro el departamento de Boyaca en lugares.");
          return;
        }

        const idBoyaca = getLugarId(deptoBoyaca);

        const provinciasMap = new Map();
        lista
          .filter(
            (lugar) =>
              normalizeText(getLugarTipo(lugar)) === "PROVINCIA" &&
              getParentId(lugar) === idBoyaca
          )
          .forEach((provincia) => {
            const id = getLugarId(provincia);
            if (id && !provinciasMap.has(id)) provinciasMap.set(id, provincia);
          });

        const provinciasBoyaca = Array.from(provinciasMap.values()).sort((a, b) =>
          getLugarNombre(a).localeCompare(getLugarNombre(b), "es", { sensitivity: "base" })
        );

        const provinciaIds = new Set(provinciasBoyaca.map((provincia) => getLugarId(provincia)));

        const municipiosMap = new Map();
        lista
          .filter(
            (lugar) =>
              normalizeText(getLugarTipo(lugar)) === "MUNICIPIO" &&
              provinciaIds.has(getParentId(lugar))
          )
          .forEach((municipio) => {
            const id = getLugarId(municipio);
            if (id && !municipiosMap.has(id)) municipiosMap.set(id, municipio);
          });

        const municipiosBoyaca = Array.from(municipiosMap.values()).sort((a, b) =>
          getLugarNombre(a).localeCompare(getLugarNombre(b), "es", { sensitivity: "base" })
        );

        setError(null);
        setProvincias(provinciasBoyaca);
        setMunicipios(municipiosBoyaca);
      })
      .catch((e) => {
        console.error(e);
        setProvincias([]);
        setMunicipios([]);
        setError("No se pudieron cargar los lugares de Boyaca.");
      });
  }, []);

  useEffect(() => {
    if (selectedReport === "municipality" || selectedReport === "province") return;
    const endpointMap = {
      ages: "/juntas/reports/edades",
      commissions: "/juntas/reports/comisiones",
      active: "/juntas/reports/activas",
      positions: "/juntas/reports/cargos",
      gender: "/juntas/reports/genero"
    };
    const endpoint = endpointMap[selectedReport];
    if (!endpoint) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(endpoint);
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();

        if (selectedReport === "ages") setAgesData(data);
        if (selectedReport === "commissions") setCommissionsData(data);
        if (selectedReport === "positions") setPositionsData(data);
        if (selectedReport === "gender") setGenderData(data);
        if (selectedReport === "active") {
          setActiveData({ activas: data.series?.[0] ?? 0, inactivas: data.series?.[1] ?? 0 });
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "No se pudo cargar el informe");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedReport]);

  const downloadReport = async (reportKey, format, extra = {}) => {
    try {
      const backendKey = routeMap[reportKey] || reportKey;
      const params = new URLSearchParams({ format });

      if (extra.filtro?.length) params.set("filtro", extra.filtro.join(","));
      if (extra.estado) params.set("estado", extra.estado);
      if (extra.municipios?.length) params.set("municipios", extra.municipios.join(","));
      if (extra.provincias?.length) params.set("provincias", extra.provincias.join(","));

      const fetchUrl = `${VITE_PATH}/juntas/reports/${backendKey}/export?${params.toString()}`;
      const res = await fetch(fetchUrl, { credentials: "include" });

      if (res.status === 404) {
        AlertMessage.error("No disponible",
          `La exportación de "${backendKey}" aún no está implementada en el servidor.`);
        return;
      }

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const ext = format === "excel" ? "xlsx" : format === "word" ? "rtf" : "pdf";
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${backendKey}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      AlertMessage.success("Descarga completada", `Archivo ${ext.toUpperCase()} descargado exitosamente`);
    } catch (e) {
      console.error(e);
      AlertMessage.error("Error", "No se pudo descargar el informe");
    }
  };

  const getFilteredData = (data, filterValue) => {
    if (!data || !data.labels || !filterValue) return data;
    const idx = data.labels.indexOf(filterValue);
    if (idx === -1) return data;
    return { labels: [data.labels[idx]], series: [data.series[idx]] };
  };

  const loadProvincias = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/juntas/reports/provincias");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setProvinceData(await res.json());
    } catch (e) {
      setError(e.message || "No se pudo cargar provincias");
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipios = async () => {
    if (!selectedMunicipalities.length) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/juntas/reports/municipios?municipios=${selectedMunicipalities.join(",")}`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setMunicipalityData(await res.json());
    } catch (e) {
      setError(e.message || "No se pudo cargar municipios");
    } finally {
      setLoading(false);
    }
  };

  const ProvinceModal = ({ province, onClose }) => {
    if (!province || !provinceData) return null;
    const idx = provinceData.labels.indexOf(province);
    if (idx === -1) return null;

    const municipios = provinceData.municipios?.[idx] || [];
    const totalJuntas = provinceData.series?.[idx] || 0;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 flex items-center justify-between bg-gradient-to-r from-[#009E76] to-[#64AF59] p-5 text-white">
            <h3 className="text-xl font-bold">Provincia: {province}</h3>
            <button onClick={onClose} className="text-3xl leading-none transition-colors hover:text-gray-200">
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-5">
              <p className="text-green-700">
                <strong className="text-4xl font-bold">{totalJuntas}</strong> juntas de acción comunal
              </p>
            </div>
            <DownloadButtons
              onDownload={(format) =>
                downloadReport("province", format, {
                  provincias: [province]
                })
              }
            />
            <h4 className="mb-3 text-base font-semibold text-gray-700">
              Municipios incluidos ({municipios.length}):
            </h4>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {municipios.map((m, i) => (
                <div key={i} className="rounded-lg border-2 bg-gray-50 p-3 text-sm text-gray-700 transition-colors hover:border-green-400">
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const filteredAges = getFilteredData(agesData, selectedAgeRange);
  const filteredCommissions = getFilteredData(commissionsData, selectedCommission);
  const filteredPositions = getFilteredData(positionsData, selectedPosition);
  const filteredGender = getFilteredData(genderData, selectedGender);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-xl border bg-white p-6">
          <h1 className="text-3xl font-bold text-gray-800">Informes de Juntas</h1>
          <p className="text-gray-600">Reportes y descargas filtradas</p>
        </div>

        <div className="mb-6 rounded-xl border bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedReport(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  selectedReport === tab.key
                    ? "bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white"
                    : "border bg-gray-100 text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          {loading && <p className="text-gray-500">Cargando...</p>}
          {error && !loading && <p className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

          {!loading && !error && (
            <>
              {selectedReport === "ages" && (
                <div>
                  <div className="mb-4 max-w-sm">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Rango de edad</label>
                    <select
                      value={selectedAgeRange}
                      onChange={(e) => setSelectedAgeRange(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">Todos</option>
                      {(agesData?.labels || []).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BarChart labels={filteredAges?.labels} series={filteredAges?.series} />
                  <DownloadButtons
                    onDownload={(format) =>
                      downloadReport("ages", format, selectedAgeRange ? { filtro: [selectedAgeRange] } : {})
                    }
                  />
                </div>
              )}

              {selectedReport === "commissions" && (
                <div>
                  <div className="mb-4 max-w-sm">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Comision</label>
                    <select
                      value={selectedCommission}
                      onChange={(e) => setSelectedCommission(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">Todas</option>
                      {(commissionsData?.labels || []).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BarChart labels={filteredCommissions?.labels} series={filteredCommissions?.series} color="bg-blue-500" />
                  <DownloadButtons
                    onDownload={(format) =>
                      downloadReport(
                        "commissions",
                        format,
                        selectedCommission ? { filtro: [selectedCommission] } : {}
                      )
                    }
                  />
                </div>
              )}

              {selectedReport === "active" && activeData && (
                <div>
                  <div className="mb-4 max-w-sm">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Estado</label>
                    <select
                      value={selectedActiveState}
                      onChange={(e) => setSelectedActiveState(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">General</option>
                      <option value="Activas">Activas</option>
                      <option value="Inactivas">Inactivas</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(selectedActiveState === "" || selectedActiveState === "Activas") && (
                      <div className="rounded-lg border-2 border-green-300 bg-green-50 p-4 text-center">
                        <p className="font-semibold text-green-700">Activas</p>
                        <p className="text-4xl font-bold text-green-800">{activeData.activas}</p>
                      </div>
                    )}
                    {(selectedActiveState === "" || selectedActiveState === "Inactivas") && (
                      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 text-center">
                        <p className="font-semibold text-red-700">Inactivas</p>
                        <p className="text-4xl font-bold text-red-800">{activeData.inactivas}</p>
                      </div>
                    )}
                  </div>
                  <DownloadButtons
                    onDownload={(format) =>
                      downloadReport("active", format, selectedActiveState ? { estado: selectedActiveState } : {})
                    }
                  />
                </div>
              )}

              {selectedReport === "positions" && (
                <div>
                  <div className="mb-4 max-w-sm">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Cargo</label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">Todos</option>
                      {(positionsData?.labels || []).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BarChart labels={filteredPositions?.labels} series={filteredPositions?.series} color="bg-purple-500" />
                  <DownloadButtons
                    onDownload={(format) =>
                      downloadReport("positions", format, selectedPosition ? { filtro: [selectedPosition] } : {})
                    }
                  />
                </div>
              )}

              {selectedReport === "gender" && (
                <div>
                  <div className="mb-4 max-w-sm">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Genero</label>
                    <select
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2"
                    >
                      <option value="">Todos</option>
                      {(genderData?.labels || []).map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {filteredGender?.labels?.length ? (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <PieChart
                        series={[
                          {
                            data: filteredGender.labels.map((label, i) => ({
                              id: i,
                              value: filteredGender.series[i],
                              label
                            })),
                            arcLabel: (item) => `${item.value}`,
                            arcLabelMinAngle: 35
                          }
                        ]}
                        sx={{
                          [`& .${pieArcLabelClasses.root}`]: { fontWeight: "bold", fill: "white" }
                        }}
                        width={400}
                        height={300}
                      />
                      <Table
                        headers={["Genero", "Cantidad"]}
                        rows={filteredGender.labels.map((label, i) => [label, filteredGender.series?.[i]])}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-400">Sin datos</p>
                  )}
                  <DownloadButtons
                    onDownload={(format) =>
                      downloadReport("gender", format, selectedGender ? { filtro: [selectedGender] } : {})
                    }
                  />
                </div>
              )}

              {selectedReport === "province" && (
                <div>
                  <button
                    onClick={loadProvincias}
                    className="mb-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#009E76] to-[#64AF59] px-5 py-2 text-white"
                  >
                    <Download size={16} />
                    Cargar provincias
                  </button>

                  {provinceData && (
                    <>
                      <BarChart labels={provinceData.labels || []} series={provinceData.series || []} color="bg-amber-500" />
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {(provinceData.labels || []).map((prov, i) => (
                          <div key={prov} className="rounded-lg border p-4 hover:shadow-md cursor-pointer transition-all" onClick={() => setModalProvince(prov)}>
                            <p className="font-bold text-gray-800">{prov}</p>
                            <p className="text-sm text-gray-500">
                              {(provinceData.municipios?.[i] || []).length} municipios
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[#009E76]">
                              {provinceData.series?.[i] || 0} juntas
                            </p>
                            <p className="text-xs text-green-600 mt-2">Ver detalles</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {selectedReport === "municipality" && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Filter size={16} />
                    Seleccion de municipios de Boyaca
                  </div>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedMunicipalities(municipios.map((m) => getLugarId(m)).filter(Boolean))}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => {
                        setSelectedMunicipalities([]);
                        setMunicipalityData(null);
                      }}
                      className="rounded border px-3 py-1 text-sm hover:bg-gray-100"
                    >
                      Ninguno
                    </button>
                    {provincias.map((prov) => (
                      <button
                        key={getLugarId(prov)}
                        onClick={() => {
                          const idProvincia = getLugarId(prov);
                          const ids = municipios
                            .filter((m) => getParentId(m) === idProvincia)
                            .map((m) => getLugarId(m))
                            .filter(Boolean);
                          setSelectedMunicipalities(ids);
                        }}
                        className="rounded border px-3 py-1 text-sm hover:bg-green-50"
                      >
                        {getLugarNombre(prov)}
                      </button>
                    ))}
                  </div>

                  <div className="grid max-h-60 grid-cols-2 gap-2 overflow-auto rounded border p-3 md:grid-cols-3 lg:grid-cols-4">
                    {municipios.map((municipio) => {
                      const id = getLugarId(municipio);
                      return (
                        <label key={id} className="flex items-center gap-2 text-sm hover:text-green-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMunicipalities.includes(id)}
                            onChange={(e) =>
                              setSelectedMunicipalities((prev) =>
                                e.target.checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)
                              )
                            }
                            className="accent-green-600"
                          />
                          {getLugarNombre(municipio)}
                        </label>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedMunicipalities([]);
                        setMunicipalityData(null);
                      }}
                      className="inline-flex items-center gap-2 rounded bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
                    >
                      <RotateCcw size={14} />
                      Limpiar
                    </button>
                    <button
                      onClick={loadMunicipios}
                      disabled={!selectedMunicipalities.length}
                      className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-[#009E76] to-[#64AF59] px-4 py-2 text-sm text-white disabled:opacity-50 hover:from-[#007d5e] hover:to-[#52934a]"
                    >
                      <Download size={14} />
                      Ver juntas
                    </button>
                  </div>

                  {municipalityData && (
                    <>
                      <BarChart
                        labels={municipalityData.labels || []}
                        series={municipalityData.series || []}
                        color="bg-orange-500"
                      />
                      <DownloadButtons
                        onDownload={(format) =>
                          downloadReport("municipality", format, {
                            municipios: selectedMunicipalities
                          })
                        }
                      />
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {modalProvince && provinceData && (
          <ProvinceModal province={modalProvince} onClose={() => setModalProvince(null)} />
        )}

        <div className="mt-8">
          <Footer />
        </div>
      </div>
    </div>
  );
}
