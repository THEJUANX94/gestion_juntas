import { useState } from "react";
import { Search, UserPlus, Users, Mail, Phone, CreditCard } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";


export default function BuscarMandatario() {

  const navigate = useNavigate();


  const { id: idJunta } = useParams();

  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setBuscado(true);

    try {
      const res = await fetch(import.meta.env.VITE_PATH + `/mandatario/buscar?query=${query}`);
      const data = await res.json();
      setResultados(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  const handleCrearNuevo = () => {
    window.location.href = `/juntas/${idJunta}/mandatario/crear`;
  };

const handleAgregarAJunta = async (user) => {
  const idUsuario = user.IDUsuario || user.NumeroIdentificacion;

  try {
    const res = await fetch(import.meta.env.VITE_PATH + `/mandatario/validar/${idJunta}/${idUsuario}`);
    const data = await res.json();

    if (data.existe) {
      AlertMessage.info("Este mandatario ya pertenece a esta junta.");
      return;
    }

    // Si NO existe → permitir navegar
    navigate(`/juntas/${idJunta}/mandatario/editar-datos/${idUsuario}`);

  } catch (error) {
    console.error(error);
    AlertMessage.error("Error validando mandatario");
  }
};


  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-[#009E76]" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Buscar Mandatario</h1>
                <p className="text-gray-500 mt-1">Busque mandatarios existentes o cree uno nuevo</p>
              </div>
            </div>

            {/* Botón Crear Mandatario */}
            <button
              onClick={handleCrearNuevo}
              className="flex items-center gap-2 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
            >
              <UserPlus size={20} />
              Crear Mandatario
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, identificación, correo o celular..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none text-base"
              />
            </div>
            <button
              onClick={buscar}
              disabled={!query.trim()}
              className="flex items-center gap-2 bg-[#009E76] hover:bg-[#007d5e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-all"
            >
              <Search size={20} />
              Buscar
            </button>
          </div>
        </div>

        {/* Resultados */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#009E76] border-t-transparent"></div>
              <p className="text-gray-600">Buscando mandatarios...</p>
            </div>
          </div>
        )}

        {!loading && buscado && resultados.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</h3>
            <p className="text-gray-500 mb-6">No hay mandatarios que coincidan con tu búsqueda</p>
            <button
              onClick={handleCrearNuevo}
              className="inline-flex items-center gap-2 bg-[#64AF59] hover:bg-[#52934a] text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
            >
              <UserPlus size={20} />
              Crear Nuevo Mandatario
            </button>
          </div>
        )}

        {!loading && !buscado && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Search className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Realiza una búsqueda</h3>
            <p className="text-gray-500">Ingresa un término de búsqueda para encontrar mandatarios</p>
          </div>
        )}

        {!loading && resultados.length > 0 && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Se encontraron <span className="font-semibold text-[#009E76]">{resultados.length}</span> resultado(s)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {resultados.map((user) => (
                <div
                  key={user.IDUsuario}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Header de la card */}
                  <div className="bg-gradient-to-r from-[#009E76] to-[#64AF59] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                      {user.PrimerNombre} {user.SegundoNombre} {user.PrimerApellido} {user.SegundoApellido}
                    </h2>
                  </div>

                  {/* Contenido de la card */}
                  <div className="p-6">
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-gray-400" />
                        <div>
                          <span className="text-sm text-gray-500">Identificación:</span>
                          <p className="font-medium text-gray-900">{user.NumeroIdentificacion}</p>
                        </div>
                      </div>

                      {user.Correo && (
                        <div className="flex items-center gap-3">
                          <Mail size={18} className="text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500">Correo:</span>
                            <p className="font-medium text-gray-900">{user.Correo}</p>
                          </div>
                        </div>
                      )}

                      {user.Celular && (
                        <div className="flex items-center gap-3">
                          <Phone size={18} className="text-gray-400" />
                          <div>
                            <span className="text-sm text-gray-500">Celular:</span>
                            <p className="font-medium text-gray-900">{user.Celular}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAgregarAJunta(user)}
                        className="flex-1 bg-[#009E76] hover:bg-[#007d5e] text-white font-semibold py-2.5 rounded-lg transition-all shadow-sm"
                      >
                        Agregar a esta Junta
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}