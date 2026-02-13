import { useState, useEffect } from "react";
import { Search, Filter, Users } from "lucide-react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";
import useAuth from "../hooks/useAuth";
import { PERMISOS } from "../config/roles";

export default function ListarJuntas() {
    const [search, setSearch] = useState("");
    const [juntas, setJuntas] = useState([]);
    const { user } = useAuth();
    const [showFilter, setShowFilter] = useState({
        razon: false,
        municipio: false,
        tipo: false,
        institucion: false,
        zona: false,
    });
    const [filtros, setFiltros] = useState({
        razon: "",
        municipio: "",
        tipo: "",
        institucion: "",
        zona: "",
    });

    const puedeVerInformes = user && PERMISOS.PUEDE_VER_INFORMES.includes(user.rol);

    /* =========================
       CARGAR JUNTAS
    ========================== */
    useEffect(() => {
        const fetchJuntas = async () => {
            try {
                const res = await fetch(import.meta.env.VITE_PATH + "/juntas/all", {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Error al cargar juntas");

                const data = await res.json();

                const transformadas = data.map((j) => ({
                    id: j.IDJunta,
                    razon: j.RazonSocial,
                    municipio: j.Lugar?.NombreLugar || "",
                    tipo: j.TipoJuntum?.NombreTipoJunta || "",
                    institucion: j.Institucion?.NombreInstitucion || "",
                    zona: j.Zona || "—",
                    periodo: `${new Date(j.FechaInicioPeriodo).toLocaleDateString()} - ${new Date(j.FechaFinPeriodo).toLocaleDateString()}`,
                }));

                setJuntas(
                    transformadas.sort((a, b) =>
                        a.razon.localeCompare(b.razon, "es", { sensitivity: "base" })
                    )
                );
            } catch (error) {
                console.error(error);
                AlertMessage.error("Error", "No se pudieron cargar las juntas.");
            }
        };

        fetchJuntas();
    }, []);

    /* =========================
       FILTROS
    ========================== */
    const generalFiltered = juntas.filter((j) => {
        const texto = search.toLowerCase();
        return Object.values(j).some((v) => String(v).toLowerCase().includes(texto));
    });

    const filtered = generalFiltered.filter((j) =>
        Object.keys(filtros).every((key) => {
            if (!filtros[key]) return true;
            return String(j[key]).toLowerCase().includes(filtros[key].toLowerCase());
        })
    );

    /* =========================
       PAGINACIÓN
    ========================== */
    const [page, setPage] = useState(1);
    const perPage = 10; // filas por página
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages]);

    const paginated = filtered.slice((page - 1) * perPage, page * perPage);

    const getPages = () => {
        // Máximo 7 botones visibles
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

    const toggleFilter = (col) =>
        setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));

    const handleFiltro = (col, value) =>
        setFiltros((prev) => ({ ...prev, [col]: value }));

    const limpiarFiltros = () =>
        setFiltros({ razon: "", municipio: "", tipo: "", institucion: "", zona: "" });

    const descargarExcel = () => {
        window.open(import.meta.env.VITE_PATH + "/juntas/export/excel", "_blank");
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Listar Juntas</h1>
                <button onClick={limpiarFiltros} className="text-sm text-green-700 underline">
                    Limpiar filtros
                </button>
            </div>

            {/* BUSCADOR */}
            <div className="flex justify-end mb-4">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar en todos los campos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-2 border rounded-md text-sm w-64"
                    />
                </div>
            </div>

            {/* TABLA */}
            <div className="flex-1 rounded-xl border shadow-sm bg-white flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                {[["Razón Social", "razon"], ["Municipio", "municipio"], ["Tipo Junta", "tipo"], ["Institución", "institucion"], ["Zona", "zona"]].map(([label, key]) => (
                                    <th key={key} className="px-4 py-2 text-left">
                                        <div className="flex items-center justify-between">
                                            {label}
                                            <button onClick={() => toggleFilter(key)}>
                                                <Filter className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                        {showFilter[key] && (
                                            <input
                                                type="text"
                                                value={filtros[key]}
                                                onChange={(e) => handleFiltro(key, e.target.value)}
                                                className="mt-1 w-full border rounded px-2 py-1 text-sm"
                                            />
                                        )}
                                    </th>
                                ))}
                                <th className="px-4 py-2">Periodo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map((j) => (
                                <tr key={j.id} className="border-b hover:bg-green-50">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-500" /> {j.razon}
                                    </td>
                                    <td className="px-4 py-3">{j.municipio}</td>
                                    <td className="px-4 py-3">{j.tipo}</td>
                                    <td className="px-4 py-3">{j.institucion}</td>
                                    <td className="px-4 py-3">{j.zona}</td>
                                    <td className="px-4 py-3">{j.periodo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* PAGINACIÓN */}
                <div className="flex items-center justify-between px-4 py-3 border-t sticky bottom-0 bg-white">
                    <p className="text-sm text-gray-600">
                        Mostrando {(page - 1) * perPage + 1} - {Math.min(page * perPage, filtered.length)} de {filtered.length}
                    </p>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded">Anterior</button>
                        {getPages().map((p, i) => p === "..." ? (
                            <span key={i} className="px-2 text-gray-400">…</span>
                        ) : (
                            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded ${page === p ? "bg-green-600 text-white" : "border"}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border rounded">Siguiente</button>
                    </div>
                </div>

                <div className="p-4">
                    {puedeVerInformes && (
                        <button onClick={descargarExcel} className="px-4 py-2 bg-green-600 text-white rounded">📊 Exportar Excel</button>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}
