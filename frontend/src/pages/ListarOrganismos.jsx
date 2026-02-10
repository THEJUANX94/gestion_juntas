import { useState, useEffect } from "react";
import { Search, Filter, User, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";
import useAuth from "../hooks/useAuth";
import { PERMISOS, ROLES } from "../config/roles";

export default function ListarOrganismos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [organismos, setOrganismos] = useState([]);
  const [showFilter, setShowFilter] = useState({ nombre: false });
  const [filtros, setFiltros] = useState({ nombre: "" });

  console.log("Usuario actual:", user);
  const puedeEditar = user && PERMISOS.PUEDE_EDITAR.includes(user.rol);

  useEffect(() => {
    const fetchOrganismos = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_PATH + "/tipojunta", { credentials: 'include', method: "GET" });
        const data = await res.json();
        const transformados = data.map((c) => ({
          IDTipoJunta: c.IDTipoJunta,
          nombre: c.NombreTipoJunta,
        }));
        setOrganismos(transformados);
      } catch (error) {
        console.error("Error al cargar organismos:", error);
      }
    };

    fetchOrganismos();
  }, []);

  const generalFiltered = organismos.filter((u) => {
    const texto = search.toLowerCase();
    return Object.values(u).some((valor) => String(valor).toLowerCase().includes(texto));
  });

  const filtered = generalFiltered.filter((u) =>
    Object.keys(filtros).every((key) => (filtros[key] ? String(u[key]).toLowerCase().includes(filtros[key].toLowerCase()) : true))
  );

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleFilter = (col) => setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));
  const handleFiltro = (col, value) => setFiltros((prev) => ({ ...prev, [col]: value }));

  const handleEdit = (item) => navigate(`/organismos/update/${item.IDTipoJunta}`);

  const handleDelete = async (item) => {
    const confirmed = await AlertMessage.confirm("Eliminar organismo", `¿Eliminar el organismo ${item.nombre}?`);
    if (!confirmed) return;

    try {
      const res = await fetch(import.meta.env.VITE_PATH + `/tipojunta/${item.IDTipoJunta}`, { method: "DELETE", credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al eliminar organismo");
      setOrganismos((prev) => prev.filter((c) => c.IDTipoJunta !== item.IDTipoJunta));
      AlertMessage.success("Eliminado", "El organismo fue eliminado correctamente.");
    } catch (err) {
      console.error(err);
      AlertMessage.error("Error", err.message || "No se pudo eliminar el organismo.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl" style={{ color: "var(--color-text-color-page)" }}>Listar Organismos</h1>
        <div className="flex gap-2">
          {puedeEditar && (
            <button className="px-4 py-2 rounded bg-green-600 text-white" onClick={() => navigate('/organismos/create')}>
              Crear Organismo
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en todos los campos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border rounded-md text-sm w-64"
            style={{ backgroundColor: "var(--color-background-table)", color: "var(--color-text-color-table)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full border rounded-md shadow-sm text-sm" style={{ backgroundColor: "var(--color-background-table)" }}>
          <thead className="text-left font-semibold" style={{ backgroundColor: "var(--color-background-upper)", color: "var(--color-text-color-upper)" }}>
            <tr>
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Nombre Comisión
                  <button onClick={() => toggleFilter('nombre')}><Filter className="h-4 w-4 text-gray-500" /></button>
                </div>
                {showFilter.nombre && (
                  <input type="text" value={filtros.nombre} onChange={(e) => handleFiltro('nombre', e.target.value)} placeholder="Filtrar por nombre" className="mt-1 w-full border rounded px-2 py-1 text-sm" />
                )}
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((u, i) => (
                <tr key={i} className="border-b transition" style={{ color: "var(--color-text-color-table)" }}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    {u.nombre}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {puedeEditar ? (
                        <>
                          <button className="..." onClick={() => handleEdit(u)} title="Editar organismo">
                            <Edit className="h-4 w-4 text-blue-600" />
                          </button>
                          <button className="..." onClick={() => handleDelete(u)} title="Eliminar organismo">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </>
                      ) : (
                        // Opcional: Mostrar un candado o texto "Solo lectura"
                        <span className="text-xs text-gray-400 italic">Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="text-center py-6 text-gray-500 italic">🚫 No se encontraron registros</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">Mostrando {Math.min((page - 1) * perPage + 1, filtered.length)} - {Math.min(page * perPage, filtered.length)} de {filtered.length}</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx} className={`px-3 py-1 rounded ${page === idx + 1 ? 'bg-green-600 text-white' : 'border'}`} onClick={() => setPage(idx + 1)}>{idx + 1}</button>
            ))}
            <button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
