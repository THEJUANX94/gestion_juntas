import { useState, useEffect } from "react";
import { Search, Filter, User, ToggleLeft, ToggleRight, FileCheck } from "lucide-react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";
import useAuth from "../hooks/useAuth";

export default function ListarMandatarios() {
  const [search, setSearch] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [showFilter, setShowFilter] = useState({ nombre: false, identificacion: false, firma: false });
  const [filtros, setFiltros] = useState({ nombre: "", identificacion: "", firma: "" });
  const { user } = useAuth();

  const puedeEditar = user && PERMISOS.PUEDE_EDITAR.includes(user.rol);

  useEffect(() => {
    const fetchMandatarios = async () => {
      try {
        // Asumiendo que existe un endpoint para mandatarios
        const res = await fetch(import.meta.env.VITE_PATH + "/usuarios/mandatarios", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        const transformados = data.map((u) => ({
          IDUsuario: u.IDUsuario,
          nombre: u.NombreCompleto,
          identificacion: u.Identificacion,
          firmaActiva: u.FirmaActiva, // Estado de la firma
        }));

        setUsuarios(
          transformados.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
          )
        );
      } catch (error) {
        console.error("Error al cargar mandatarios:", error);
        AlertMessage.error("Error", "No se pudieron cargar los mandatarios.");
      }
    };

    fetchMandatarios();
  }, []);

  // Lógica de filtrado
  const generalFiltered = usuarios.filter((u) => {
    const texto = search.toLowerCase();
    return Object.values(u).some((valor) => String(valor).toLowerCase().includes(texto));
  });

  const filtered = generalFiltered.filter((u) =>
    Object.keys(filtros).every((key) => {
      if (!filtros[key]) return true;
      if (key === "firma") {
        const textoFirma = u.firmaActiva ? "activada" : "desactivada";
        return textoFirma.toLowerCase().includes(filtros.firma.toLowerCase());
      }
      return String(u[key]).toLowerCase().includes(filtros[key].toLowerCase());
    })
  );

  // Paginación
  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleFilter = (col) => setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));
  const handleFiltro = (col, value) => setFiltros((prev) => ({ ...prev, [col]: value }));

  // FUNCIÓN PRINCIPAL: Toggle de la Firma
  const handleToggleFirma = async (usuario) => {
    const nuevoEstadoFirma = !usuario.firmaActiva;

    const confirmed = await AlertMessage.confirm(
      "Gestionar Firma",
      `¿Deseas ${nuevoEstadoFirma ? "ACTIVAR" : "DESACTIVAR"} la firma de "${usuario.nombre}" (ID: ${usuario.identificacion})?${nuevoEstadoFirma ? "\n\n⚠️ NOTA: Esto desactivará automáticamente cualquier otra firma activa." : ""
      }`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        import.meta.env.VITE_PATH + `/usuarios/${usuario.identificacion}/firma/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Activo: nuevoEstadoFirma }),
        }
      );

      if (!res.ok) throw new Error("Error al cambiar estado de la firma");

      // ✅ Actualizar el estado local correctamente
      if (nuevoEstadoFirma) {
        // Si se ACTIVÓ esta firma, desactivar todas las demás en el frontend
        setUsuarios((prev) =>
          prev.map((u) => ({
            ...u,
            firmaActiva: u.IDUsuario === usuario.IDUsuario,
          }))
        );
      } else {
        // Si se DESACTIVÓ, solo actualizar esta firma
        setUsuarios((prev) =>
          prev.map((u) =>
            u.IDUsuario === usuario.IDUsuario ? { ...u, firmaActiva: false } : u
          )
        );
      }

      AlertMessage.success(
        "Firma actualizada",
        `La firma de ${usuario.nombre} ahora está ${nuevoEstadoFirma ? "ACTIVA" : "INACTIVA"}.`
      );
    } catch (error) {
      console.error(error);
      AlertMessage.error("Error", "No se pudo actualizar el estado de la firma.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl" style={{ color: "var(--color-text-color-page)" }}>
          Gestión de Firmas - Mandatarios
        </h1>
      </div>

      {/* Buscador global */}
      <div className="flex justify-end mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar mandatario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 border rounded-md text-sm w-64"
            style={{
              backgroundColor: "var(--color-background-table)",
              color: "var(--color-text-color-table)",
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="min-w-full border rounded-md shadow-sm text-sm" style={{ backgroundColor: "var(--color-background-table)" }}>
          <thead className="text-left font-semibold" style={{ backgroundColor: "var(--color-background-upper)", color: "var(--color-text-color-upper)" }}>
            <tr>
              {/* Columna Nombre */}
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Nombre Mandatario
                  <button onClick={() => toggleFilter("nombre")}><Filter className="h-4 w-4" /></button>
                </div>
                {showFilter.nombre && (
                  <input
                    type="text"
                    onChange={(e) => handleFiltro("nombre", e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1 text-black"
                  />
                )}
              </th>

              {/* Columna Identificación */}
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Identificación
                  <button onClick={() => toggleFilter("identificacion")}><Filter className="h-4 w-4" /></button>
                </div>
                {showFilter.identificacion && (
                  <input
                    type="text"
                    onChange={(e) => handleFiltro("identificacion", e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1 text-black"
                  />
                )}
              </th>

              {/* Columna Estado Firma */}
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Estado Firma
                  {puedeEditar && (
                    <button onClick={() => toggleFilter("firma")}><Filter className="h-4 w-4" /></button>
                  )}
                </div>
                {showFilter.firma && (
                  <input
                    type="text"
                    placeholder="activa/inactiva"
                    onChange={(e) => handleFiltro("firma", e.target.value)}
                    className="mt-1 w-full border rounded px-2 py-1 text-black"
                  />
                )}
              </th>

              <th className="px-4 py-2 text-center">Acción Firma</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((user) => (
                <tr key={user.IDUsuario} className="border-b transition" style={{ color: "var(--color-text-color-table)" }}>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" /> {user.nombre}
                  </td>
                  <td className="px-4 py-3 font-mono">{user.identificacion}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.firmaActiva ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {user.firmaActiva ? "FIRMA ACTIVA" : "SIN FIRMA"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleFirma(user)}
                      title={user.firmaActiva ? "Desactivar Firma" : "Activar Firma"}
                      className="p-2 rounded hover:bg-gray-100"
                    >
                      {user.firmaActiva ? (
                        <ToggleRight className="h-6 w-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-gray-400" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-6 text-gray-500 italic">No se encontraron mandatarios</td></tr>
            )}
          </tbody>
        </table>

        {/* Paginación similar a la anterior */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">Total: {filtered.length} mandatarios</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded">Anterior</button>
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded">Siguiente</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}