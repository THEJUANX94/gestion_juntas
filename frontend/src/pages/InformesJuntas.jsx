import React, { useEffect, useState } from "react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

// VITE_PATH apunta al backend (ej: http://mi-servidor.com:3000)

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

  // ── Estado por reporte ──────────────────────────────────────────
  const [agesData,        setAgesData]        = useState(null);
  const [commissionsData, setCommissionsData] = useState(null);
  const [activeData,      setActiveData]      = useState(null);
  const [positionsData,   setPositionsData]   = useState(null);
  const [genderData,      setGenderData]      = useState(null);
  const [provinceData,    setProvinceData]    = useState(null);

  // ── Estado para el selector de municipios ──────────────────────
  // provincias = registros con TipoLugar='Departamento'
  // municipios = registros con TipoLugar='Municipio'
  const [provincias,             setProvincias]             = useState([]);
  const [municipios,             setMunicipios]             = useState([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState([]);
  const [municipalityData,       setMunicipalityData]       = useState(null);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // ── Cargar lugares al montar ────────────────────────────────────
  // /api/lugares devuelve TODOS los Lugar (departamentos y municipios)
  // Los separamos por TipoLugar para usarlos en el selector
  useEffect(() => {
    apiFetch("/lugares")
      .then((r) => (r.ok ? r.json() : Promise.reject("Error cargando lugares")))
      .then((data) => {
        const lista = Array.isArray(data) ? data : [];

        // 'Departamento' en esta BD = provincias de Boyacá
        setProvincias(
          lista
            .filter((l) => l.TipoLugar === "Departamento")
            .sort((a, b) => a.NombreLugar.localeCompare(b.NombreLugar))
        );

        // 'Municipio' = municipios; IDOtroLugar apunta a su provincia padre
        setMunicipios(
          lista
            .filter((l) => l.TipoLugar === "Municipio")
            .sort((a, b) => a.NombreLugar.localeCompare(b.NombreLugar))
        );
      })
      .catch((e) => {
        console.error(e);
        setProvincias([]);
        setMunicipios([]);
      });
  }, []);

  // ── Carga automática al cambiar de reporte ──────────────────────
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
          // Backend devuelve { labels:["Activas","Inactivas"], series:[n,n] }
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

  // ── Cargar reporte de provincias ────────────────────────────────
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

  // ── Cargar reporte de municipios filtrado ───────────────────────
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

  // ── Descarga ────────────────────────────────────────────────────
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
    } catch (e) {
      console.error(e);
      AlertMessage.error("Error", "No se pudo descargar el informe");
    }
  };

  // ── Sub-componentes ─────────────────────────────────────────────
  const BarChart = ({ labels = [], series = [], color = "bg-green-600" }) => {
    if (!labels.length)
      return <p className="text-sm text-gray-400 mt-2">Sin datos para mostrar</p>;
    const max = Math.max(...series, 1);
    return (
      <div className="space-y-2 mt-2">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-44 text-sm text-gray-700 truncate" title={label}>{label}</div>
            <div className="flex-1 bg-gray-100 rounded h-6 overflow-hidden">
              <div style={{ width: `${(series[i] / max) * 100}%` }}
                className={`h-6 ${color} transition-all duration-500`} />
            </div>
            <div className="w-10 text-right text-sm font-semibold">{series[i]}</div>
          </div>
        ))}
      </div>
    );
  };

  const DownloadButtons = ({ reportKey, extra = {} }) => (
    <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t">
      <button onClick={() => downloadReport(reportKey, "excel", extra)}
        className="px-4 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded text-sm font-medium">
        ⬇ Excel
      </button>
      <button onClick={() => downloadReport(reportKey, "word", extra)}
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
        ⬇ Word
      </button>
      <button onClick={() => downloadReport(reportKey, "pdf", extra)}
        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium">
        ⬇ PDF
      </button>
    </div>
  );

  const SimpleTable = ({ headers, rows }) => (
    <div className="mt-4 overflow-auto max-h-60">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 text-left">
            {headers.map((h, i) => <th key={i} className="p-2 border font-medium">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              {row.map((cell, j) => <td key={j} className="p-2 border">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { key: "ages",         label: " Por Edades"  },
    { key: "commissions",  label: " Comisiones"  },
    { key: "active",       label: " Activas"      },
    { key: "positions",    label: " Cargos"       },
    { key: "gender",       label: " Género"        },
    { key: "province",     label: " Provincias"   },
    { key: "municipality", label: " Municipio"    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Informes de Juntas</h1>
        <p className="text-sm text-gray-500 mt-1">Consulta y descarga los informes estadísticos</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setSelectedReport(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedReport === t.key
                ? "bg-green-600 text-white shadow"
                : "border border-gray-300 hover:border-green-500 hover:text-green-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Panel principal */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl border shadow-sm p-5 min-h-72">
            <h2 className="text-lg font-semibold mb-1">
              {tabs.find((t) => t.key === selectedReport)?.label}
            </h2>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                <svg className="animate-spin h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Cargando datos...
              </div>
            )}
            {error && !loading && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                ⚠ {error}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* ══ EDADES ══ */}
                {selectedReport === "ages" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Distribución de miembros por rango de edad</p>
                    <BarChart labels={agesData?.labels ?? []} series={agesData?.series ?? []} />
                    <DownloadButtons reportKey="ages" />
                  </div>
                )}

                {/* ══ COMISIONES ══ */}
                {selectedReport === "commissions" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Comisiones con mayor participación</p>
                    <BarChart labels={commissionsData?.labels ?? []} series={commissionsData?.series ?? []} color="bg-blue-500" />
                    {(commissionsData?.labels?.length ?? 0) > 0 && (
                      <SimpleTable
                        headers={["Comisión", "Participantes"]}
                        rows={commissionsData.labels.map((l, i) => [l, commissionsData.series?.[i]])}
                      />
                    )}
                    <DownloadButtons reportKey="commissions" />
                  </div>
                )}

                {/* ══ ACTIVAS ══ */}
                {selectedReport === "active" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">Estado actual de las juntas registradas</p>
                    {activeData ? (
                      <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                            <p className="text-sm text-green-700 font-medium">Activas</p>
                            <p className="text-3xl font-bold text-green-800">{activeData.activas}</p>
                          </div>
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                            <p className="text-sm text-red-700 font-medium">Inactivas</p>
                            <p className="text-3xl font-bold text-red-800">{activeData.inactivas}</p>
                          </div>
                        </div>
                        <BarChart
                          labels={["Activas", "Inactivas"]}
                          series={[activeData.activas, activeData.inactivas]}
                          color="bg-teal-500"
                        />
                      </>
                    ) : <p className="text-sm text-gray-400">Sin datos</p>}
                    <DownloadButtons reportKey="active" />
                  </div>
                )}

                {/* ══ CARGOS ══ */}
                {selectedReport === "positions" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Distribución de personas por cargo</p>
                    <BarChart labels={positionsData?.labels ?? []} series={positionsData?.series ?? []} color="bg-purple-500" />
                    {(positionsData?.labels?.length ?? 0) > 0 && (
                      <SimpleTable
                        headers={["Cargo", "Personas"]}
                        rows={positionsData.labels.map((l, i) => [l, positionsData.series?.[i]])}
                      />
                    )}
                    <DownloadButtons reportKey="positions" />
                  </div>
                )}

                {/* ══ GÉNERO ══ */}
                {selectedReport === "gender" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Distribución de miembros por género</p>
                    <BarChart labels={genderData?.labels ?? []} series={genderData?.series ?? []} color="bg-pink-500" />
                    {(genderData?.labels?.length ?? 0) > 0 && (
                      <SimpleTable
                        headers={["Género", "Cantidad"]}
                        rows={genderData.labels.map((l, i) => [l, genderData.series?.[i]])}
                      />
                    )}
                    <DownloadButtons reportKey="gender" />
                  </div>
                )}

                {/* ══ PROVINCIAS DE BOYACÁ ══ */}
                {selectedReport === "province" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      Juntas de Acción Comunal por provincia de Boyacá
                    </p>
                    <button onClick={cargarProvincias} disabled={loading}
                      className="mb-4 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50">
                      {loading ? "Cargando..." : "Cargar informe"}
                    </button>

                    {provinceData ? (
                      <>
                        <BarChart
                          labels={provinceData.labels ?? []}
                          series={provinceData.series ?? []}
                          color="bg-amber-500"
                        />
                        <div className="mt-4 overflow-auto max-h-72">
                          <table className="min-w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-gray-50 text-left">
                                <th className="p-2 border font-medium">Provincia</th>
                                <th className="p-2 border font-medium">N° Juntas</th>
                                <th className="p-2 border font-medium">Municipios</th>
                              </tr>
                            </thead>
                            <tbody>
                              {provinceData.labels?.map((label, i) => (
                                <tr key={i} className="border-t hover:bg-gray-50">
                                  <td className="p-2 border font-medium">{label}</td>
                                  <td className="p-2 border">{provinceData.series?.[i]}</td>
                                  <td className="p-2 border text-xs text-gray-500">
                                    {(provinceData.municipios?.[i] || []).join(", ")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      !loading && (
                        <p className="text-sm text-gray-400">
                          Presiona el botón para cargar el informe
                        </p>
                      )
                    )}
                    <DownloadButtons reportKey="province" />
                  </div>
                )}

                {/* ══ MUNICIPIOS ══ */}
                {selectedReport === "municipality" && (
                  <div>
                    <p className="text-sm text-gray-500 mb-3">
                      Selecciona municipios de Boyacá para ver sus juntas
                    </p>

                    {/* Botones de provincia → selección rápida por provincia */}
                    {/* Usa IDOtroLugar para filtrar los municipios de cada provincia */}
                    {provincias.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">
                          Seleccionar por provincia:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setSelectedMunicipalities(municipios.map((m) => m.IDLugar))}
                            className="px-2 py-0.5 text-xs border rounded hover:bg-gray-100">
                            Todos
                          </button>
                          <button
                            onClick={() => { setSelectedMunicipalities([]); setMunicipalityData(null); }}
                            className="px-2 py-0.5 text-xs border rounded hover:bg-red-50 hover:border-red-300">
                            Ninguno
                          </button>
                          {provincias.map((prov) => (
                            <button key={prov.IDLugar}
                              title={`Seleccionar municipios de ${prov.NombreLugar}`}
                              onClick={() => {
                                // IDOtroLugar del municipio = IDLugar de su provincia padre
                                const ids = municipios
                                  .filter((m) => m.IDOtroLugar === prov.IDLugar)
                                  .map((m) => m.IDLugar);
                                setSelectedMunicipalities(ids);
                              }}
                              className="px-2 py-0.5 text-xs border rounded hover:bg-green-50 hover:border-green-400">
                              {prov.NombreLugar}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista de municipios con checkbox */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-52 overflow-auto border rounded p-2 mb-2 bg-gray-50 text-sm">
                      {municipios.length === 0 ? (
                        <p className="text-gray-400 col-span-3">Cargando municipios...</p>
                      ) : (
                        municipios.map((m) => (
                          <label key={m.IDLugar}
                            className="flex items-center gap-1.5 cursor-pointer hover:text-green-700">
                            <input
                              type="checkbox"
                              checked={selectedMunicipalities.includes(m.IDLugar)}
                              onChange={(e) => {
                                const id = m.IDLugar;
                                setSelectedMunicipalities((prev) =>
                                  e.target.checked ? [...prev, id] : prev.filter((x) => x !== id)
                                );
                              }}
                              className="accent-green-600"
                            />
                            {m.NombreLugar}
                          </label>
                        ))
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mb-3">
                      {selectedMunicipalities.length} de {municipios.length} municipio(s) seleccionado(s)
                    </p>

                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => { setSelectedMunicipalities([]); setMunicipalityData(null); }}
                        className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">
                        Limpiar
                      </button>
                      <button onClick={cargarMunicipios}
                        disabled={selectedMunicipalities.length === 0 || loading}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm disabled:opacity-50">
                        {loading ? "Cargando..." : "Ver juntas"}
                      </button>
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
                        <p className="text-sm text-gray-400">
                          Selecciona municipios y presiona "Ver juntas"
                        </p>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold mb-3">Descargar reporte actual</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => downloadReport(selectedReport, "excel")}
                className="px-3 py-2 bg-green-700 hover:bg-green-800 text-white rounded text-sm">
                ⬇ Descargar Excel
              </button>
              <button onClick={() => downloadReport(selectedReport, "word")}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                ⬇ Descargar Word
              </button>
              <button onClick={() => downloadReport(selectedReport, "pdf")}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                ⬇ Descargar PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="font-semibold mb-2">Reportes disponibles</h3>
            <ul className="text-sm text-gray-600 space-y-1.5 mt-2">
              <li><strong>Edades</strong> — Rangos etarios</li>
              <li><strong>Comisiones</strong> — Participación</li>
              <li><strong>Activas</strong> — Estado de juntas</li>
              <li><strong>Cargos</strong> — Distribución</li>
              <li><strong>Género</strong> — Por género</li>
              <li><strong>Provincias</strong> — Por provincia de Boyacá</li>
              <li><strong>Municipio</strong> — Filtrado por municipio</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Footer />
      </div>
    </div>
  );
}
