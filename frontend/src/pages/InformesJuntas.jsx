import React, { useEffect, useState } from "react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { Filter, Download, FileSpreadsheet, FileText, FileType, RotateCcw } from "lucide-react";

const VITE_PATH =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_PATH
    ? import.meta.env.VITE_PATH
    : "";

if (!VITE_PATH)
  console.warn("VITE_PATH no está definida en el .env del frontend");

const apiFetch = (path, opts = {}) =>
  fetch(`${VITE_PATH}${path}`, { credentials: "include", ...opts });

export default function InformesJuntas() {
  const [selectedReport, setSelectedReport] = useState("ages");

  // Estados de datos
  const [agesData,        setAgesData]        = useState(null);
  const [commissionsData, setCommissionsData] = useState(null);
  const [activeData,      setActiveData]      = useState(null);
  const [positionsData,   setPositionsData]   = useState(null);
  const [genderData,      setGenderData]      = useState(null);
  const [provinceData,    setProvinceData]    = useState(null);

  // Estados de filtros
  const [provincias,             setProvincias]             = useState([]);
  const [municipios,             setMunicipios]             = useState([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [municipalityData,       setMunicipalityData]       = useState(null);
  const [modalProvince,          setModalProvince]          = useState(null);

  // Estados de filtros específicos por reporte
  const [selectedAgeRange,    setSelectedAgeRange]    = useState("");
  const [selectedCommission,  setSelectedCommission]  = useState("");
  const [selectedActiveState, setSelectedActiveState] = useState("");
  const [selectedPosition,    setSelectedPosition]    = useState("");
  const [selectedGender,      setSelectedGender]      = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  /**
   * Carga inicial de lugares desde el backend
   * Separa provincias (TipoLugar="Departamento") de municipios (TipoLugar="Municipio")
   * Solo incluye municipios cuyo IDOtroLugar corresponde a una provincia cargada
   */
  useEffect(() => {
    apiFetch("/lugares")
      .then((r) => (r.ok ? r.json() : Promise.reject("Error cargando lugares")))
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];
        
        // Filtrar provincias de Boyacá (TipoLugar = "Departamento")
        // Usar Set para eliminar duplicados por IDLugar
        const provinciasUnicas = new Map();
        lista
          .filter((l) => l.TipoLugar === "Departamento")
          .forEach((p) => {
            if (!provinciasUnicas.has(p.IDLugar)) {
              provinciasUnicas.set(p.IDLugar, p);
            }
          });
        
        const provincias = Array.from(provinciasUnicas.values())
          .sort((a, b) => a.NombreLugar.localeCompare(b.NombreLugar));
        
        setProvincias(provincias);
        
        // Filtrar municipios que pertenecen a alguna de las provincias cargadas
        // IDOtroLugar del municipio debe coincidir con IDLugar de una provincia
        const idsProvincias = new Set(provincias.map(p => p.IDLugar));
        const municipiosUnicos = new Map();
        lista
          .filter((l) => l.TipoLugar === "Municipio" && idsProvincias.has(l.IDOtroLugar))
          .forEach((m) => {
            if (!municipiosUnicos.has(m.IDLugar)) {
              municipiosUnicos.set(m.IDLugar, m);
            }
          });
        
        const municipiosBoyaca = Array.from(municipiosUnicos.values())
          .sort((a, b) => a.NombreLugar.localeCompare(b.NombreLugar));
        
        setMunicipios(municipiosBoyaca);
        
        console.log("Provincias cargadas:", provincias.length);
        console.log("Municipios de Boyacá:", municipiosBoyaca.length);
      })
      .catch((e) => {
        console.error(e);
        setProvincias([]);
        setMunicipios([]);
      });
  }, []);

  /**
   * Carga automática de datos cuando cambia el reporte seleccionado
   * No aplica para municipios y provincias que requieren acción manual
   */
  useEffect(() => {
    if (selectedReport === "municipality" || selectedReport === "province") return;

    const endpointMap = {
      ages:        "/juntas/reports/edades",
      commissions: "/juntas/reports/comisiones",
      active:      "/juntas/reports/activas",
      positions:   "/juntas/reports/cargos",
      gender:      "/juntas/reports/genero",
    };

    const endpoint = endpointMap[selectedReport];
    if (!endpoint) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(endpoint);
        if (!res.ok) throw new Error(`Error ${res.status} al cargar el reporte`);
        const data = await res.json();

        if (selectedReport === "ages")        setAgesData(data);
        if (selectedReport === "commissions") setCommissionsData(data);
        if (selectedReport === "positions")   setPositionsData(data);
        if (selectedReport === "gender")      setGenderData(data);
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

  const cargarProvincias = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/juntas/reports/provincias");
      if (!res.ok) throw new Error(`Error ${res.status} al cargar provincias`);
      setProvinceData(await res.json());
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo cargar el informe de provincias");
    } finally {
      setLoading(false);
    }
  };

  const cargarMunicipios = async () => {
    if (selectedMunicipalities.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const qs  = `?municipios=${selectedMunicipalities.join(",")}`;
      const res = await apiFetch(`/juntas/reports/municipios${qs}`);
      if (!res.ok) throw new Error(`Error ${res.status} al cargar municipios`);
      setMunicipalityData(await res.json());
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo cargar el informe de municipios");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Descarga de reportes en diferentes formatos
   * NOTA: Esta función llama al endpoint de export que debe estar implementado en el backend
   * El backend debe generar los archivos usando librerías apropiadas:
   * - Excel: exceljs o xlsx
   * - Word: docx
   * - PDF: pdfkit o puppeteer
   */
  const downloadReport = async (reportKey, format = "excel", extra = {}) => {
    try {
      const routeMap = {
        ages: "edades", commissions: "comisiones", active: "activas",
        positions: "cargos", gender: "genero",
        province: "provincias", municipality: "municipios",
      };
      const backendKey = routeMap[reportKey] || reportKey;
      const params     = new URLSearchParams({ format });
      if (extra.municipios?.length) params.set("municipios", extra.municipios.join(","));

      const url = `${VITE_PATH}/juntas/reports/${backendKey}/export?${params}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 404) {
        AlertMessage.error("No disponible",
          `La exportación de "${backendKey}" aún no está implementada en el servidor.`);
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status}`);

      const blob = await res.blob();
      const ext  = format === "excel" ? "xlsx" : format === "word" ? "docx" : "pdf";
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = `${backendKey}-${new Date().toISOString().slice(0, 10)}.${ext}`;
      document.body.appendChild(a); a.click(); a.remove();
      
      AlertMessage.success("Descarga iniciada", `El archivo ${ext.toUpperCase()} se está descargando`);
    } catch (e) {
      console.error(e);
      AlertMessage.error("Error", "No se pudo descargar el informe");
    }
  };

  /**
   * Aplica filtros sobre los datos según el reporte y filtro seleccionado
   * Retorna un subconjunto de los datos originales si hay filtro activo
   */
  const getFilteredData = (data, filterValue) => {
    if (!data || !data.labels || !filterValue) return data;
    
    const idx = data.labels.indexOf(filterValue);
    if (idx !== -1) {
      return {
        labels: [data.labels[idx]],
        series: [data.series[idx]]
      };
    }
    
    return data;
  };

  /**
   * Limpia todos los filtros activos y resetea los estados relacionados
   */
  const limpiarFiltros = () => {
    setSelectedAgeRange("");
    setSelectedCommission("");
    setSelectedActiveState("");
    setSelectedPosition("");
    setSelectedGender("");
    setSelectedMunicipalities([]);
    setMunicipalityData(null);
  };

  const BarChart = ({ labels = [], series = [], color = "bg-green-600" }) => {
    if (!labels.length)
      return <p className="text-sm text-gray-400 mt-2">Sin datos para mostrar</p>;
    const max = Math.max(...series, 1);
    return (
      <div className="space-y-2 mt-2">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-48 text-sm text-gray-700 truncate" title={label}>{label}</div>
            <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
              <div style={{ width: `${(series[i] / max) * 100}%` }}
                className={`h-6 ${color} transition-all duration-500`} />
            </div>
            <div className="w-12 text-right text-sm font-semibold">{series[i]}</div>
          </div>
        ))}
      </div>
    );
  };

  const DownloadButtons = ({ reportKey, extra = {} }) => (
    <div className="mt-6 pt-4 border-t flex flex-wrap gap-3 justify-center">
      <button onClick={() => downloadReport(reportKey, "excel", extra)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
        <FileSpreadsheet size={18} />
        Descargar Excel
      </button>
      <button onClick={() => downloadReport(reportKey, "word", extra)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
        <FileText size={18} />
        Descargar Word
      </button>
      <button onClick={() => downloadReport(reportKey, "pdf", extra)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-lg">
        <FileType size={18} />
        Descargar PDF
      </button>
    </div>
  );

  const SimpleTable = ({ headers, rows }) => (
    <div className="mt-4 overflow-auto max-h-72">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white">
            {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left font-semibold">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-t hover:bg-blue-50 transition-colors`}>
              {row.map((cell, j) => <td key={j} className="px-4 py-3 border">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const ProvinceModal = ({ province, onClose }) => {
    if (!province) return null;
    const idx = provinceData.labels.indexOf(province);
    if (idx === -1) return null;

    const municipios = provinceData.municipios?.[idx] || [];
    const totalJuntas = provinceData.series?.[idx] || 0;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white p-5 flex justify-between items-center">
            <h3 className="text-xl font-bold">
              Provincia: {province}
            </h3>
            <button onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl leading-none transition-colors">
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="mb-6 p-5 bg-green-50 border-2 border-green-200 rounded-lg">
              <p className="text-green-700">
                <strong className="text-4xl font-bold">{totalJuntas}</strong> juntas de acción comunal
              </p>
            </div>
            <h4 className="text-base font-semibold text-gray-700 mb-3">
              Municipios incluidos ({municipios.length}):
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {municipios.map((m, i) => (
                <div key={i} className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg border-2 hover:border-green-400 transition-colors">
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Componente de filtro reutilizable para diferentes reportes
   * Muestra un dropdown con opciones y botón de limpiar si hay filtro activo
   */
  const FilterSection = ({ label, options, value, onChange, onClear }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="text-[#009E76]" size={20} />
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
          <select
            value={value}
            onChange={onChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5">
            <option value="">Todas las opciones</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        {value && (
          <button
            onClick={onClear}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg transition-all">
            <RotateCcw size={16} />
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );

  const tabs = [
    { key: "ages",         label: "Por Edades"  },
    { key: "commissions",  label: "Comisiones"  },
    { key: "active",       label: "Activas"      },
    { key: "positions",    label: "Cargos"       },
    { key: "gender",       label: "Género"        },
    { key: "province",     label: "Provincias"   },
    { key: "municipality", label: "Municipio"    },
  ];

  // Aplicar filtros a cada reporte
  const filteredAgesData = getFilteredData(agesData, selectedAgeRange);
  const filteredCommissionsData = getFilteredData(commissionsData, selectedCommission);
  const filteredPositionsData = getFilteredData(positionsData, selectedPosition);
  const filteredGenderData = getFilteredData(genderData, selectedGender);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3">
            <Download className="text-[#009E76]" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Informes de Juntas</h1>
              <p className="text-gray-600 mt-1">Consulta y descarga los informes estadísticos</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setSelectedReport(t.key)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  selectedReport === t.key
                    ? "bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white shadow-md scale-105"
                    : "bg-gray-100 border border-gray-300 text-gray-700 hover:border-[#009E76] hover:text-[#009E76] hover:shadow-sm"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros dinámicos según reporte */}
        {selectedReport === "ages" && agesData && (
          <FilterSection
            label="Rango de Edad"
            options={agesData.labels}
            value={selectedAgeRange}
            onChange={(e) => setSelectedAgeRange(e.target.value)}
            onClear={limpiarFiltros}
          />
        )}

        {selectedReport === "commissions" && commissionsData && (
          <FilterSection
            label="Comisión"
            options={commissionsData.labels}
            value={selectedCommission}
            onChange={(e) => setSelectedCommission(e.target.value)}
            onClear={limpiarFiltros}
          />
        )}

        {selectedReport === "active" && activeData && (
          <FilterSection
            label="Estado"
            options={["Activas", "Inactivas"]}
            value={selectedActiveState}
            onChange={(e) => setSelectedActiveState(e.target.value)}
            onClear={limpiarFiltros}
          />
        )}

        {selectedReport === "positions" && positionsData && (
          <FilterSection
            label="Cargo"
            options={positionsData.labels}
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            onClear={limpiarFiltros}
          />
        )}

        {selectedReport === "gender" && genderData && (
          <FilterSection
            label="Género"
            options={genderData.labels}
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            onClear={limpiarFiltros}
          />
        )}

        {/* Panel principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            {tabs.find((t) => t.key === selectedReport)?.label}
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-10 w-10 text-[#009E76] mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* EDADES */}
              {selectedReport === "ages" && (
                <div>
                  <p className="text-gray-600 mb-4">Distribución de miembros por rango de edad</p>
                  <BarChart labels={filteredAgesData?.labels ?? []} series={filteredAgesData?.series ?? []} />
                  <DownloadButtons reportKey="ages" />
                </div>
              )}

              {/* COMISIONES */}
              {selectedReport === "commissions" && (
                <div>
                  <p className="text-gray-600 mb-4">Comisiones con mayor participación</p>
                  <BarChart labels={filteredCommissionsData?.labels ?? []} series={filteredCommissionsData?.series ?? []} color="bg-blue-500" />
                  <DownloadButtons reportKey="commissions" />
                </div>
              )}

              {/* ACTIVAS */}
              {selectedReport === "active" && (
                <div>
                  <p className="text-gray-600 mb-6">Estado actual de las juntas registradas</p>
                  {activeData ? (
                    <>
                      {selectedActiveState === "" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center shadow-sm">
                            <p className="text-lg text-green-700 font-semibold mb-2">Activas</p>
                            <p className="text-5xl font-bold text-green-800">{activeData.activas}</p>
                          </div>
                          <div className="p-6 bg-red-50 border-2 border-red-300 rounded-xl text-center shadow-sm">
                            <p className="text-lg text-red-700 font-semibold mb-2">Inactivas</p>
                            <p className="text-5xl font-bold text-red-800">{activeData.inactivas}</p>
                          </div>
                        </div>
                      )}
                      {selectedActiveState === "Activas" && (
                        <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center shadow-sm max-w-md mx-auto">
                          <p className="text-lg text-green-700 font-semibold mb-2">Activas</p>
                          <p className="text-5xl font-bold text-green-800">{activeData.activas}</p>
                        </div>
                      )}
                      {selectedActiveState === "Inactivas" && (
                        <div className="p-6 bg-red-50 border-2 border-red-300 rounded-xl text-center shadow-sm max-w-md mx-auto">
                          <p className="text-lg text-red-700 font-semibold mb-2">Inactivas</p>
                          <p className="text-5xl font-bold text-red-800">{activeData.inactivas}</p>
                        </div>
                      )}
                    </>
                  ) : <p className="text-gray-400">Sin datos</p>}
                  <DownloadButtons reportKey="active" />
                </div>
              )}

              {/* CARGOS */}
              {selectedReport === "positions" && (
                <div>
                  <p className="text-gray-600 mb-4">Distribución de personas por cargo</p>
                  <BarChart labels={filteredPositionsData?.labels ?? []} series={filteredPositionsData?.series ?? []} color="bg-purple-500" />
                  <DownloadButtons reportKey="positions" />
                </div>
              )}

              {/* GÉNERO - Layout mejorado */}
              {selectedReport === "gender" && (
                <div>
                  <p className="text-gray-600 mb-6">Distribución de miembros por género</p>
                  {filteredGenderData && filteredGenderData.labels?.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      <div className="flex justify-center">
                        <PieChart
                          series={[{
                            data: filteredGenderData.labels.map((label, i) => ({
                              id: i,
                              value: filteredGenderData.series[i],
                              label: label
                            })),
                            arcLabel: (item) => `${item.value}`,
                            arcLabelMinAngle: 35,
                            arcLabelRadius: '60%',
                          }]}
                          sx={{
                            [`& .${pieArcLabelClasses.root}`]: {
                              fontWeight: 'bold',
                              fill: 'white',
                            },
                          }}
                          width={400}
                          height={300}
                        />
                      </div>
                      <div className="flex items-center">
                        <SimpleTable
                          headers={["Género", "Cantidad"]}
                          rows={filteredGenderData.labels.map((l, i) => [l, filteredGenderData.series?.[i]])}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Sin datos</p>
                  )}
                  <DownloadButtons reportKey="gender" />
                </div>
              )}

              {/* PROVINCIAS */}
              {selectedReport === "province" && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Juntas de Acción Comunal por provincia de Boyacá
                  </p>
                  <button onClick={cargarProvincias} disabled={loading}
                    className="mb-6 inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-md">
                    <Download size={18} />
                    {loading ? "Cargando..." : "Cargar informe"}
                  </button>

                  {provinceData ? (
                    <>
                      <BarChart
                        labels={provinceData.labels ?? []}
                        series={provinceData.series ?? []}
                        color="bg-amber-500"
                      />
                      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {provinceData.labels?.map((label, i) => (
                          <div key={i}
                            onClick={() => setModalProvince(label)}
                            className="p-5 border-2 rounded-xl hover:shadow-lg hover:border-[#009E76] cursor-pointer transition-all bg-white">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-bold text-lg text-gray-800">{label}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                  {(provinceData.municipios?.[i] || []).length} municipios
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-3xl font-bold text-[#009E76]">
                                  {provinceData.series?.[i]}
                                </p>
                                <p className="text-xs text-gray-500">juntas</p>
                              </div>
                            </div>
                            <p className="text-sm text-[#009E76] font-medium">
                              Click para ver municipios
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    !loading && <p className="text-gray-400">Presiona el botón para cargar el informe</p>
                  )}
                  <DownloadButtons reportKey="province" />
                </div>
              )}

              {/* MUNICIPIOS */}
              {selectedReport === "municipality" && (
                <div>
                  <p className="text-gray-600 mb-4">
                    Selecciona municipios de Boyacá para ver sus juntas
                  </p>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Filter className="text-[#009E76]" size={20} />
                      <h3 className="text-lg font-semibold text-gray-800">Selección de Municipios</h3>
                    </div>

                    {provincias.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Seleccionar por provincia:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedMunicipalities(municipios.map((m) => m.IDLugar))}
                            className="px-3 py-1.5 text-sm bg-white border-2 border-gray-300 rounded-lg hover:border-[#009E76] hover:bg-gray-50 transition-all font-medium">
                            Todos
                          </button>
                          <button
                            onClick={() => { setSelectedMunicipalities([]); setMunicipalityData(null); }}
                            className="px-3 py-1.5 text-sm bg-white border-2 border-red-300 rounded-lg hover:bg-red-50 transition-all font-medium">
                            Ninguno
                          </button>
                          {provincias.map((prov) => (
                            <button key={prov.IDLugar}
                              title={`Seleccionar municipios de ${prov.NombreLugar}`}
                              onClick={() => {
                                const ids = municipios
                                  .filter((m) => m.IDOtroLugar === prov.IDLugar)
                                  .map((m) => m.IDLugar);
                                setSelectedMunicipalities(ids);
                              }}
                              className="px-3 py-1.5 text-sm bg-white border-2 border-gray-300 rounded-lg hover:border-[#009E76] hover:bg-green-50 transition-all font-medium">
                              {prov.NombreLugar}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-auto border-2 rounded-lg p-3 bg-white">
                      {municipios.length === 0 ? (
                        <p className="text-gray-400 col-span-full text-center py-4">Cargando municipios...</p>
                      ) : (
                        municipios.map((m) => (
                          <label key={m.IDLugar}
                            className="flex items-center gap-2 cursor-pointer hover:text-[#009E76] transition-colors p-2 rounded hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedMunicipalities.includes(m.IDLugar)}
                              onChange={(e) => {
                                const id = m.IDLugar;
                                setSelectedMunicipalities((prev) =>
                                  e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                                );
                              }}
                              className="accent-[#009E76] w-4 h-4"
                            />
                            <span className="text-sm">{m.NombreLugar}</span>
                          </label>
                        ))
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        <strong className="text-[#009E76]">{selectedMunicipalities.length}</strong> de <strong>{municipios.length}</strong> municipio(s) seleccionado(s)
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setSelectedMunicipalities([]); setMunicipalityData(null); }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-all">
                          <RotateCcw size={16} />
                          Limpiar
                        </button>
                        <button onClick={cargarMunicipios}
                          disabled={selectedMunicipalities.length === 0 || loading}
                          className="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white rounded-lg font-semibold disabled:opacity-50 transition-all shadow-md">
                          <Download size={18} />
                          {loading ? "Cargando..." : "Ver juntas"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {municipalityData ? (
                    <>
                      <BarChart
                        labels={municipalityData.labels ?? []}
                        series={municipalityData.series ?? []}
                        color="bg-orange-500"
                      />
                      <SimpleTable
                        headers={["Municipio", "Juntas"]}
                        rows={(municipalityData.labels ?? []).map((l, i) => [
                          l, municipalityData.series?.[i]
                        ])}
                      />
                      <DownloadButtons
                        reportKey="municipality"
                        extra={{ municipios: selectedMunicipalities }}
                      />
                    </>
                  ) : (
                    !loading && (
                      <p className="text-gray-400 text-center py-8">
                        Selecciona municipios y presiona Ver juntas
                      </p>
                    )
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
