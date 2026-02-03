import { useState, useEffect } from "react";
import { Search, Filter, MapPin, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function ListarLugares() {
  const [search, setSearch] = useState("");
  const [lugares, setLugares] = useState([]);
  const [showFilter, setShowFilter] = useState({ nombre: false, tipo: false, estado: false });
  const [filtros, setFiltros] = useState({ nombre: "", tipo: "", estado: "" });
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);

  useEffect(() => {
    const fetchLugares = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_PATH}/lugares/municipios?departamento=Boyacá`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        // Verifica que data sea un array
        if (!Array.isArray(data)) {
          console.error("La respuesta no es un array:", data);
          AlertMessage.error("Error", "Formato de respuesta inválido.");
          return;
        }
        // Filtrar municipios que pertenecen a Boyacá
        const provinciasBoyacaIds = data
          .filter(l => l.TipoLugar === "Provincia")
          .map(p => p.IDLugar);
        const soloMunicipiosBoyaca = data.filter(
          l => l.TipoLugar === "Municipio" && provinciasBoyacaIds.includes(l.idotrolugar)
        );

        setMunicipiosFiltrados(soloMunicipiosBoyaca);

        const transformados = soloMunicipiosBoyaca.map((l) => ({
          IDLugar: l.IDLugar,
          nombre: l.NombreLugar,
          tipo: l.TipoLugar,
          activo: l.Activo,
        }));

        setLugares(
          transformados.sort((a, b) =>
            a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
          )
        );
      } catch (error) {
        console.error("Error al cargar lugares:", error);
        AlertMessage.error("Error", "No se pudieron cargar los lugares.");
        setLugares([]);
      }
    };
    fetchLugares();
  }, []);

  const generalFiltered = lugares.filter((l) => {
    const texto = search.toLowerCase();
    return Object.values(l).some((valor) => String(valor).toLowerCase().includes(texto));
  });

  const filtered = generalFiltered.filter((l) =>
    Object.keys(filtros).every((key) => {
      if (!filtros[key]) return true;
      if (key === "estado") {
        const textoEstado = l.activo ? "activo" : "inactivo";
        return textoEstado.toLowerCase().includes(filtros.estado.toLowerCase());
      }
      return String(l[key]).toLowerCase().includes(filtros[key].toLowerCase());
    })
  );

  const [page, setPage] = useState(1);
  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleFilter = (col) =>
    setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));

  const handleFiltro = (col, value) =>
    setFiltros((prev) => ({ ...prev, [col]: value }));

  const handleToggleActivo = async (item) => {
    const nuevoEstado = !item.activo;

    const confirmed = await AlertMessage.confirm(
      "Cambiar estado",
      `¿Deseas marcar el lugar "${item.nombre}" como ${nuevoEstado ? "ACTIVO" : "INACTIVO"}?`
    );
    if (!confirmed) return;

    // Actualización optimista en el estado
    setLugares((prev) =>
      prev.map((l) =>
        l.IDLugar === item.IDLugar ? { ...l, activo: nuevoEstado } : l
      )
    );

    try {
      const res = await fetch(
        import.meta.env.VITE_PATH + `/lugares/${item.IDLugar}/estado`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Activo: nuevoEstado }),
        }
      );

      if (!res.ok) throw new Error("Error al cambiar estado del lugar");

      // Si quieres usar la respuesta del backend:
      // const actualizado = await res.json();
      // setLugares((prev) =>
      //   prev.map((l) =>
      //   prev.map((l) =>
      //     l.IDLugar === item.IDLugar
      //       ? { ...l, activo: actualizado.Activo }
      //       : l
      //   )
      // );

      AlertMessage.success(
        "Estado actualizado",
        `El lugar ahora está ${nuevoEstado ? "ACTIVO" : "INACTIVO"}.`
      );
    } catch (error) {
      console.error(error);

      // Si falla, revertimos el cambio visual
      setLugares((prev) =>
        prev.map((l) =>
          l.IDLugar === item.IDLugar ? { ...l, activo: !nuevoEstado } : l
        )
      );
      AlertMessage.error(
        "Error",
        "No se pudo cambiar el estado del lugar."
      );
    }
  };


  const handleDelete = async (item) => {
    const confirmed = await AlertMessage.confirm(
      "Eliminar lugar",
      `¿Eliminar el lugar "${item.nombre}"?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        import.meta.env.VITE_PATH + `/lugares/${item.IDLugar}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Error al eliminar lugar");

      setLugares((prev) => prev.filter((l) => l.IDLugar !== item.IDLugar));
      AlertMessage.success("Eliminado", "El lugar fue eliminado correctamente.");
    } catch (error) {
      console.error(error);
      AlertMessage.error("Error", "No se pudo eliminar el lugar.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl"
          style={{ color: "var(--color-text-color-page)" }}
        >
          Listar Lugares
        </h1>
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
            style={{
              backgroundColor: "var(--color-background-table)",
              color: "var(--color-text-color-table)",
            }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="flex-1 overflow-x-auto">
        <table
          className="min-w-full border rounded-md shadow-sm text-sm"
          style={{ backgroundColor: "var(--color-background-table)" }}
        >
          <thead
            className="text-left font-semibold"
            style={{
              backgroundColor: "var(--color-background-upper)",
              color: "var(--color-text-color-upper)",
            }}
          >
            <tr>
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Nombre Lugar
                  <button onClick={() => toggleFilter("nombre")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.nombre && (
                  <input
                    type="text"
                    value={filtros.nombre}
                    onChange={(e) => handleFiltro("nombre", e.target.value)}
                    placeholder="Filtrar por nombre"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>

              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Tipo
                  <button onClick={() => toggleFilter("tipo")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.tipo && (
                  <input
                    type="text"
                    value={filtros.tipo}
                    onChange={(e) => handleFiltro("tipo", e.target.value)}
                    placeholder="Filtrar por tipo"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>

              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Estado
                  <button onClick={() => toggleFilter("estado")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.estado && (
                  <input
                    type="text"
                    value={filtros.estado}
                    onChange={(e) => handleFiltro("estado", e.target.value)}
                    placeholder='Filtrar ("activo"/"inactivo")'
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>

              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? (
              paginated.map((lugar, i) => (
                <tr
                  key={i}
                  className="border-b transition"
                  style={{ color: "var(--color-text-color-table)" }}
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                      <MapPin className="h-5 w-5 text-gray-500" />
                    </div>
                    {lugar.nombre}
                  </td>
                  <td className="px-4 py-3">{lugar.tipo}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${lugar.activo
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {lugar.activo ? "ACTIVO" : "INACTIVO"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <button
                        className="p-2 rounded hover:bg-gray-100"
                        onClick={() => handleToggleActivo(lugar)}
                        title="Cambiar estado"
                      >
                        {lugar.activo ? (
                          <ToggleRight className="h-5 w-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center py-6 text-gray-500 italic"
                >
                  🚫 No se encontraron registros
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
            {Math.min(page * perPage, filtered.length)} de {filtered.length}
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
                className={`px-3 py-1 rounded ${page === idx + 1 ? "bg-green-600 text-white" : "border"
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
      </div>

      <Footer />
    </div>
  );
}
