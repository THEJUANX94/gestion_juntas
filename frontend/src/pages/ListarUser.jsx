import { useState, useEffect, useMemo } from "react";
import { Search, Edit, User, Filter, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";


export default function ListarPersonas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Nuevo estado para la carga

  // 💡 Estados para la PAGINACIÓN
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Puedes ajustar este valor


  const [showFilter, setShowFilter] = useState({
    nombre: false,
    identificacion: false,
    rol: false,
    ultimo: false,
  });
  const [filtros, setFiltros] = useState({
    nombre: "",
    identificacion: "",
    rol: "",
    ultimo: "",
  });

  //Traer usuarios del backend
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_PATH + "/usuarios", {
          credentials: 'include',
          method: "GET"
        });
        const data = await res.json();

        // Transformar formato
        const transformados = data.map((u) => ({
          nombre: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),
          identificacion: u.NumeroIdentificacion,
          rol: u.RolInfo ? u.RolInfo.NombreRol : 'Sin Rol',
          ultimo: u.ultimo_inicio_sesion ? new Date(u.ultimo_inicio_sesion).toLocaleString('es-ES', { hour12: false }) : '',
        }));

        setUsuarios(transformados);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsuarios();
  }, []);
  const filtered = useMemo(() => {
    // Filtrado general
    const generalFiltered = usuarios.filter((a) => {
      const texto = search.toLowerCase();
      return (
        a.nombre.toLowerCase().includes(texto) ||
        a.identificacion.toLowerCase().includes(texto) ||
        a.rol.toLowerCase().includes(texto) ||
        a.ultimo.toLowerCase().includes(texto)
      );
    });

    // Filtrado por columnas
    const columnFiltered = generalFiltered.filter((a) =>
      Object.keys(filtros).every((key) =>
        filtros[key]
          ? String(a[key]).toLowerCase().includes(filtros[key].toLowerCase())
          : true
      )
    );

    // 💡 Al cambiar los filtros o la búsqueda, volvemos a la primera página.
    setCurrentPage(1);

    return columnFiltered;
  }, [usuarios, search, filtros]);


  // 2. Lógica de PAGINACIÓN
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Obtiene los elementos de la página actual
  const paginatedItems = filtered.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  // Manejadores de filtro y eliminación (sin cambios)
  const toggleFilter = (col) => {
    setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleFiltro = (col, value) => {
    setFiltros((prev) => ({ ...prev, [col]: value }));
  };

  const handleEdit = (usuario) => {
    navigate(`/usuarios/update/${usuario.identificacion}`);
  };


  const handleDelete = async (usuario) => {
    const confirmed = await AlertMessage.confirm(
      "Eliminar usuario",
      `¿Estás segura(o) de eliminar a ${usuario.nombre} ? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch(import.meta.env.VITE_PATH + `/usuarios/${usuario.identificacion}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (!res.ok) throw new Error("Error al eliminar el usuario");


      setUsuarios((prev) => prev.filter((u) => u.identificacion !== usuario.identificacion));

      AlertMessage.success("Eliminado", "El usuario fue eliminado correctamente.");
    } catch (err) {
      console.error(err);
      AlertMessage.error("Error", "No se pudo eliminar el usuario.");
    }
  };


  return (
    <div className="flex flex-col h-full">
      <h1
        className="text-2xl mb-6"
        style={{ color: "var(--color-text-color-page)" }}
      >
        Listar Usuarios
      </h1>

      {/* Buscador general */}
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
                  Nombre Usuario
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
                  Número de Identificación
                  <button onClick={() => toggleFilter("identificacion")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.identificacion && (
                  <input
                    type="text"
                    value={filtros.identificacion}
                    onChange={(e) =>
                      handleFiltro("identificacion", e.target.value)
                    }
                    placeholder="Filtrar por ID"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Rol
                  <button onClick={() => toggleFilter("rol")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.rol && (
                  <input
                    type="text"
                    value={filtros.rol}
                    onChange={(e) => handleFiltro("rol", e.target.value)}
                    placeholder="Filtrar por rol"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>
              <th className="px-4 py-2">
                <div className="flex items-center justify-between">
                  Ultimo inicio de sesion
                  <button onClick={() => toggleFilter("ultimo")}>
                    <Filter className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                {showFilter.ultimo && (
                  <input
                    type="text"
                    value={filtros.ultimo}
                    onChange={(e) => handleFiltro("ultimo", e.target.value)}
                    placeholder="Filtrar por fecha"
                    className="mt-1 w-full border rounded px-2 py-1 text-sm"
                  />
                )}
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-blue-500 text-lg">
                  Cargando asistencias...
                </td>
              </tr>
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((u, i) => (
                <tr
                  key={i}
                  className="border-b transition"
                  style={{ color: "var(--color-text-color-table)" }}
                >
                  <td className="px-4 py-3 flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    {u.nombre}
                  </td>
                  <td className="px-4 py-3">{u.identificacion}</td>
                  <td className="px-4 py-3">{u.rol}</td>
                  <td className="px-4 py-3">{u.ultimo}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      className="p-2 rounded hover:bg-gray-100"
                      onClick={() => handleEdit(u)}
                      title="Editar usuario"
                    >
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>

                    <button
                      className="p-2 rounded hover:bg-gray-100"
                      onClick={() => handleDelete(u)}
                      title="Eliminar usuario"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-500 italic"
                >
                  🚫 No se encontraron registros de la búsqueda
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* 💡 CONTROLES DE PAGINACIÓN */}
      {filtered.length > 0 && !isLoading && (
        <div className="flex justify-between items-center py-4 px-6 border-t border-gray-200">

          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Filas por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded-md p-1 bg-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filtered.length)} de {filtered.length} resultados
          </div>
          <div className="flex space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`p-2 rounded-full border transition duration-150 ${currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-center px-4 border border-gray-300 rounded-lg bg-blue-50 text-blue-700 font-semibold">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`p-2 rounded-full border transition duration-150 ${currentPage === totalPages || totalPages === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
      {/* FIN CONTROLES DE PAGINACIÓN */}
      <Footer />
    </div>
  );
}
