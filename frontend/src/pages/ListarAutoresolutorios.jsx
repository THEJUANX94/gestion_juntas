import { useState, useEffect, useMemo } from "react";
import { Search, Filter, FileCheck, ArrowUp, ArrowDown, FileSpreadsheet, BarChart3, RotateCcw } from "lucide-react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

const COLUMNAS = [
  { key: "IDCertificado", label: "ID" },
  { key: "FechaCreacion", label: "Fecha Creación" },
  { key: "RazonSocial", label: "Razón Social" },
  { key: "Municipio", label: "Municipio" },
  { key: "TipoCertificado", label: "Tipo Certificado" },
  { key: "NombreCertificado", label: "Nombre Certificado" },
  { key: "ElaboradoPor", label: "Elaborado Por" },
  { key: "GeneradoPor", label: "Generado Por" }
];

const initialFiltros = COLUMNAS.reduce((acc, c) => ({ ...acc, [c.key]: "" }), {});
const initialShowFilter = COLUMNAS.reduce((acc, c) => ({ ...acc, [c.key]: false }), {});

const formatFecha = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const anio = d.getFullYear();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${dia}/${mes}/${anio} ${h}:${m}`;
};

const mesLabel = (date) => {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Gráfico de barras horizontal simple, basado en el de InformesJuntas.
 */
const BarChart = ({ labels = [], series = [], color = "bg-green-600" }) => {
  if (!labels.length) {
    return <p className="mt-3 text-sm text-gray-400">Sin datos para mostrar</p>;
  }
  const max = Math.max(...series, 1);
  return (
    <div className="mt-3 space-y-2">
      {labels.map((label, i) => (
        <div key={`${label}-${i}`} className="flex items-center gap-3">
          <div className="w-56 truncate text-sm text-gray-700" title={label}>
            {label}
          </div>
          <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100">
            <div
              style={{ width: `${(series[i] / max) * 100}%` }}
              className={`h-6 ${color}`}
            />
          </div>
          <div className="w-12 text-right text-sm font-semibold">{series[i]}</div>
        </div>
      ))}
    </div>
  );
};

export default function ListarAutoresolutorios() {
  const [certificados, setCertificados] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(initialShowFilter);
  const [filtros, setFiltros] = useState(initialFiltros);
  const [sort, setSort] = useState({ key: "IDCertificado", dir: "desc" });

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showGrafica, setShowGrafica] = useState(false);
  const [graficaModo, setGraficaModo] = useState("usuario"); // "usuario" | "mes"

  useEffect(() => {
    const fetchCertificados = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_PATH + "/certificados/listar", {
          method: "GET",
          credentials: "include"
        });
        if (!res.ok) throw new Error("Error al cargar los autoresolutorios");
        const data = await res.json();
        setCertificados(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        AlertMessage.error("Error", "No se pudieron cargar los autoresolutorios.");
      } finally {
        setLoading(false);
      }
    };
    fetchCertificados();
  }, []);

  const filtered = useMemo(() => {
    const texto = search.trim().toLowerCase();
    const desde = fechaDesde ? new Date(fechaDesde + "T00:00:00") : null;
    const hasta = fechaHasta ? new Date(fechaHasta + "T23:59:59") : null;

    return certificados.filter((c) => {
      if (desde || hasta) {
        const f = c.FechaCreacion ? new Date(c.FechaCreacion) : null;
        if (!f || Number.isNaN(f.getTime())) return false;
        if (desde && f < desde) return false;
        if (hasta && f > hasta) return false;
      }

      if (texto) {
        const combinado = [
          c.IDCertificado,
          formatFecha(c.FechaCreacion),
          c.RazonSocial,
          c.Municipio,
          c.TipoCertificado,
          c.NombreCertificado,
          c.ElaboradoPor,
          c.GeneradoPor
        ]
          .map((v) => String(v ?? "").toLowerCase())
          .join(" | ");
        if (!combinado.includes(texto)) return false;
      }

      return COLUMNAS.every((col) => {
        const valFiltro = filtros[col.key];
        if (!valFiltro) return true;
        let valor = c[col.key];
        if (col.key === "FechaCreacion") valor = formatFecha(c.FechaCreacion);
        return String(valor ?? "").toLowerCase().includes(valFiltro.toLowerCase());
      });
    });
  }, [certificados, search, filtros, fechaDesde, fechaHasta]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let va = a[key];
      let vb = b[key];
      if (key === "FechaCreacion") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (key === "IDCertificado") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else {
        va = String(va ?? "").toLowerCase();
        vb = String(vb ?? "").toLowerCase();
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const getPages = () => {
    const maxButtons = 7;
    const pages = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    if (start > 1) pages.push(1, "...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) pages.push("...", totalPages);
    return pages;
  };

  const toggleFilter = (key) =>
    setShowFilter((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleFiltro = (key, value) => {
    setFiltros((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSort = (key) => {
    setSort((prev) => {
      if (prev.key === key) return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      return { key, dir: "asc" };
    });
  };

  const limpiarTodo = () => {
    setSearch("");
    setFiltros(initialFiltros);
    setFechaDesde("");
    setFechaHasta("");
    setShowFilter(initialShowFilter);
    setSort({ key: "IDCertificado", dir: "desc" });
    setPage(1);
  };

  const descargarExcel = () => {
    window.open(import.meta.env.VITE_PATH + "/certificados/export/excel", "_blank");
  };

  const datosGrafica = useMemo(() => {
    if (graficaModo === "usuario") {
      const counts = {};
      sorted.forEach((c) => {
        const k = c.GeneradoPor || "Sin registrar";
        counts[k] = (counts[k] || 0) + 1;
      });
      const pares = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      return {
        labels: pares.map(([l]) => l),
        series: pares.map(([, v]) => v)
      };
    }

    const bucket = new Map();
    sorted.forEach((c) => {
      if (!c.FechaCreacion) return;
      const d = new Date(c.FechaCreacion);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entry = bucket.get(key) || { label: mesLabel(d), count: 0 };
      entry.count += 1;
      bucket.set(key, entry);
    });
    const pares = Array.from(bucket.entries()).sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: pares.map(([, v]) => v.label),
      series: pares.map(([, v]) => v.count)
    };
  }, [sorted, graficaModo]);

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: "var(--color-text-color-page)" }}>
          <FileCheck className="h-6 w-6 text-green-700" />
          Autoresolutorios Generados
        </h1>
        <button
          onClick={limpiarTodo}
          className="text-sm text-green-700 underline inline-flex items-center gap-1"
        >
          <RotateCcw className="h-4 w-4" /> Limpiar filtros
        </button>
      </div>

      {/* FILTROS SUPERIORES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Buscar (cualquier campo)</label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Razón social, municipio, usuario, tipo..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 pr-3 py-2 border rounded-md text-sm w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setPage(1);
            }}
            className="px-2 py-2 border rounded-md text-sm w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setPage(1);
            }}
            className="px-2 py-2 border rounded-md text-sm w-full"
          />
        </div>
      </div>

      {/* TABLA */}
      <div className="flex-1 rounded-xl border shadow-sm bg-white flex flex-col">
        <div className="overflow-x-auto overflow-y-auto max-h-[55vh]">
          <table className="min-w-full text-sm">
            <thead
              className="sticky top-0 z-10"
              style={{
                backgroundColor: "var(--color-background-upper)",
                color: "var(--color-text-color-upper)"
              }}
            >
              <tr>
                {COLUMNAS.map((col) => (
                  <th key={col.key} className="px-4 py-2 text-left align-top">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleSort(col.key)}
                        className="inline-flex items-center gap-1 font-semibold"
                        title="Ordenar"
                      >
                        {col.label}
                        {sort.key === col.key &&
                          (sort.dir === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          ))}
                      </button>
                      <button onClick={() => toggleFilter(col.key)} title="Filtrar">
                        <Filter className="h-4 w-4" />
                      </button>
                    </div>
                    {showFilter[col.key] && (
                      <input
                        type="text"
                        value={filtros[col.key]}
                        onChange={(e) => handleFiltro(col.key, e.target.value)}
                        placeholder={`Filtrar ${col.label.toLowerCase()}...`}
                        className="mt-1 w-full border rounded px-2 py-1 text-sm text-black"
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="text-center py-10 text-gray-500 italic">
                    Cargando autoresolutorios...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={COLUMNAS.length} className="text-center py-10 text-gray-500 italic">
                    No se encontraron autoresolutorios con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((c) => (
                  <tr
                    key={c.IDCertificado}
                    className="border-b hover:bg-green-50"
                    style={{ color: "var(--color-text-color-table)" }}
                  >
                    <td className="px-4 py-3 font-mono">{c.IDCertificado}</td>
                    <td className="px-4 py-3">{formatFecha(c.FechaCreacion)}</td>
                    <td className="px-4 py-3">{c.RazonSocial || "—"}</td>
                    <td className="px-4 py-3">{c.Municipio || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {c.TipoCertificado || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.NombreCertificado || "—"}</td>
                    <td className="px-4 py-3">{c.ElaboradoPor || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{c.GeneradoPor || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-white">
          <p className="text-sm text-gray-600">
            Mostrando {sorted.length === 0 ? 0 : (page - 1) * perPage + 1} -{" "}
            {Math.min(page * perPage, sorted.length)} de {sorted.length}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            {getPages().map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded ${page === p ? "bg-green-600 text-white" : "border"}`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="flex flex-wrap gap-2 p-4 border-t">
          <button
            onClick={descargarExcel}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 text-sm"
          >
            <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
          </button>
          <button
            onClick={() => setShowGrafica((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            <BarChart3 className="h-4 w-4" />
            {showGrafica ? "Ocultar gráfica" : "Ver gráfica"}
          </button>
        </div>
      </div>

      {showGrafica && (
        <div className="mt-4 rounded-xl border bg-white shadow-sm p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-semibold text-gray-700">
              Autoresolutorios {graficaModo === "usuario" ? "por usuario generador" : "por mes"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGraficaModo("usuario")}
                className={`px-3 py-1 rounded text-sm ${
                  graficaModo === "usuario" ? "bg-green-700 text-white" : "border"
                }`}
              >
                Por usuario
              </button>
              <button
                onClick={() => setGraficaModo("mes")}
                className={`px-3 py-1 rounded text-sm ${
                  graficaModo === "mes" ? "bg-green-700 text-white" : "border"
                }`}
              >
                Por mes
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            La gráfica se calcula sobre los registros filtrados actualmente ({sorted.length}).
          </p>
          <BarChart
            labels={datosGrafica.labels}
            series={datosGrafica.series}
            color={graficaModo === "usuario" ? "bg-green-600" : "bg-blue-500"}
          />
        </div>
      )}

      <Footer />
    </div>
  );
}
