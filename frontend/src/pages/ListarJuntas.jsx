import { useState, useEffect } from "react";
import { Search, Filter, Users } from "lucide-react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function ListarJuntas() {
    const [search, setSearch] = useState("");
    const [juntas, setJuntas] = useState([]);
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

    /* =========================
       CARGAR JUNTAS
    ========================== */
    useEffect(() => {
        const fetchJuntas = async () => {
            try {
                const res = await fetch(
                    import.meta.env.VITE_PATH + "/juntas/all",
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) throw new Error("Error al cargar juntas");

                const data = await res.json();

                const transformadas = data.map((j) => ({
                    id: j.IDJunta,
                    razon: j.RazonSocial,
                    municipio: j.Lugar?.NombreLugar || "",
                    tipo: j.TipoJunta?.NombreTipoJunta || "",
                    institucion: j.Institucion?.NombreInstitucion || "",
                    zona: j.Zona,
                    periodo: `${new Date(j.FechaInicioPeriodo).toLocaleDateString()} - ${new Date(
                        j.FechaFinPeriodo
                    ).toLocaleDateString()}`,
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
       FILTRO GLOBAL
    ========================== */
    const generalFiltered = juntas.filter((j) => {
        const texto = search.toLowerCase();
        return Object.values(j).some((v) =>
            String(v).toLowerCase().includes(texto)
        );
    });

    const descargarExcel = () => {
        window.open(
            import.meta.env.VITE_PATH + "/juntas/export/excel",
            "_blank"
        );
    };

    /* =========================
       FILTROS POR COLUMNA
    ========================== */
    const filtered = generalFiltered.filter((j) =>
        Object.keys(filtros).every((key) => {
            if (!filtros[key]) return true;
            return String(j[key])
                .toLowerCase()
                .includes(filtros[key].toLowerCase());
        })
    );

    /* =========================
       PAGINACIÓN
    ========================== */
    const [page, setPage] = useState(1);
    const perPage = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages]);

    const paginated = filtered.slice(
        (page - 1) * perPage,
        page * perPage
    );

    const toggleFilter = (col) =>
        setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));

    const handleFiltro = (col, value) =>
        setFiltros((prev) => ({ ...prev, [col]: value }));

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl">Listar Juntas</h1>
            </div>

            {/* Buscador global */}
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

            {/* Tabla */}
            <div className="flex-1 overflow-x-auto">
                <table className="min-w-full border rounded-md shadow-sm text-sm">
                    <thead className="bg-gray-100 text-left font-semibold">
                        <tr>
                            {[
                                ["Razón Social", "razon"],
                                ["Municipio", "municipio"],
                                ["Tipo Junta", "tipo"],
                                ["Institución", "institucion"],
                                ["Zona", "zona"],
                            ].map(([label, key]) => (
                                <th key={key} className="px-4 py-2">
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
                                            onChange={(e) =>
                                                handleFiltro(key, e.target.value)
                                            }
                                            placeholder={`Filtrar ${label}`}
                                            className="mt-1 w-full border rounded px-2 py-1 text-sm"
                                        />
                                    )}
                                </th>
                            ))}
                            <th className="px-4 py-2">Periodo</th>
                        </tr>
                    </thead>

                    <tbody>
                        {paginated.length > 0 ? (
                            paginated.map((j) => (
                                <tr key={j.id} className="border-b">
                                    <td className="px-4 py-3 flex items-center gap-2">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                                            <Users className="h-5 w-5 text-gray-500" />
                                        </div>
                                        {j.razon}
                                    </td>
                                    <td className="px-4 py-3">{j.municipio}</td>
                                    <td className="px-4 py-3">{j.tipo}</td>
                                    <td className="px-4 py-3">{j.institucion}</td>
                                    <td className="px-4 py-3">{j.zona}</td>
                                    <td className="px-4 py-3">{j.periodo}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="text-center py-6 text-gray-500 italic"
                                >
                                    🚫 No se encontraron juntas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Paginación */}
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-600">
                        Mostrando{" "}
                        {Math.min((page - 1) * perPage + 1, filtered.length)} -{" "}
                        {Math.min(page * perPage, filtered.length)} de{" "}
                        {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            className="px-3 py-1 border rounded"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }).map((_, idx) => (
                            <button
                                key={idx}
                                className={`px-3 py-1 rounded ${page === idx + 1
                                        ? "bg-green-600 text-white"
                                        : "border"
                                    }`}
                                onClick={() => setPage(idx + 1)}
                            >
                                {idx + 1}
                            </button>
                        ))}
                        <button
                            className="px-3 py-1 border rounded"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
                <div>
                    <button
                        onClick={descargarExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded"
                    >
                        📊 Exportar Excel
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
