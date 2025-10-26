import { useState, useEffect } from "react";
import { Search, Edit, User, Filter, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";


export default function ListarPersonas() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [usuarios, setUsuarios] = useState([]);

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
          IDUsuario: u.IDUsuario,
          nombre: `${u.PrimerNombre} ${u.SegundoNombre ?? ""} ${u.PrimerApellido} ${u.SegundoApellido ?? ""}`.trim(),
          identificacion: u.NumeroIdentificacion,
          rol: u.rol,
         // Mostrar solo fecha y hora sin zona
         ultimo: u.ultimo_inicio_sesion ? new Date(u.ultimo_inicio_sesion).toLocaleString('es-ES', { hour12: false }) : '',
        }));

        setUsuarios(transformados);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    };

    fetchUsuarios();
  }, []);

  //  Filtrado general
  const generalFiltered = usuarios.filter((u) => {
    const texto = search.toLowerCase();
    return Object.values(u).some((valor) =>
      String(valor).toLowerCase().includes(texto)
    );
  });

  //  Filtrado por columnas
  const filtered = generalFiltered.filter((u) =>
    Object.keys(filtros).every((key) =>
      filtros[key]
        ? String(u[key]).toLowerCase().includes(filtros[key].toLowerCase())
        : true
    )
  );


  const toggleFilter = (col) => {
    setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));
  };

  const handleFiltro = (col, value) => {
    setFiltros((prev) => ({ ...prev, [col]: value }));
  };

  const handleEdit = (usuario) => {
    navigate(`/usuarios/update/${usuario.IDUsuario}`);
  };


  const handleDelete = async (usuario) => {
    console.log("Intentando eliminar usuario:", usuario.IDUsuario);
    const confirmed = await AlertMessage.confirm(
      "Eliminar usuario",
      `¿Estás segura(o) de eliminar a ${usuario.nombre} ? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
       console.log("Intentando eliminar usuario otra vez:", usuario.IDUsuario);
      const res = await fetch(import.meta.env.VITE_PATH + `/usuarios/${usuario.IDUsuario}`, {
        method: "DELETE",
        credentials: 'include'
      });

      if (!res.ok) throw new Error("Error al eliminar el usuario");


      setUsuarios((prev) => prev.filter((u) => u.IDUsuario !== usuario.IDUsuario));

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
            {filtered.length > 0 ? (
              filtered.map((u, i) => (
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

      <Footer />
    </div>
  );
}
