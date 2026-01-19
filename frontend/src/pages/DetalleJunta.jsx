import { useState, useEffect } from "react";
import { FileText, Award, ClipboardCheck, Database, UserPlus, Edit2, Phone, Mail, MapPin, Search, Filter, X, Trash2 } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function DetalleJunta() {

  const navigate = useNavigate();
  const location = useLocation();


  const juntaData = location.state?.junta || null;
  const juntaIdFromRoute = juntaData?.IDJunta || null;
  const [miembros, setMiembros] = useState([]);

  const { id } = useParams();

  useEffect(() => {
    const cargarMiembros = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_PATH + `/mandatario/${id}/miembros`);
        const data = await res.json();
        console.log("Miembros cargados:", data);
        const transformados = data.map(m => {
          const partesNombre = m.nombreCompleto?.split(" ") || [];
          const nombre = partesNombre.slice(0, 2).join(" ");
          const apellido = partesNombre.slice(2).join(" ");

          return {
            cargo: m.cargo || "",
            comision: m.comision || "No aplica",
            periodo: m.periodoJunta || "",
            inicioMandato: m.inicioMandato || "",
            finMandato: m.finMandato || "",
            tipoDoc: m.tipoDocumento || "",
            documento: m.documento || "",
            expedido: m.expedido || "",
            nombre: nombre,
            apellido: apellido,
            genero: m.genero || "",
            edad: m.edad || "",
            nacimiento: m.nacimiento || "",
            residencia: m.residencia || "",
            telefono: m.telefono || "",
            profesion: m.profesion || "",
            email: m.email || "",
          };
        });


        setMiembros(transformados);
      } catch (error) {
        console.error("Error cargando miembros:", error);
      }
    };

    cargarMiembros();
  }, [id]);

  function calcularEdad(fecha) {
    if (!fecha) return "";
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  const formatear = (fecha) => {
    if (!fecha) return "";
    const f = new Date(fecha);
    return `${f.getDate().toString().padStart(2, "0")}/${(f.getMonth() + 1)
      .toString().padStart(2, "0")}/${f.getFullYear()}`;
  };





  const [searchTerm, setSearchTerm] = useState("");
  const [filtros, setFiltros] = useState({
    cargo: "",
    periodo: "",
    genero: "",
    comision: ""
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const acciones = [
    { icon: FileText, label: "Consulta", color: "bg-[#009E76] hover:bg-[#007d5e]", action: 'consulta' },
    { icon: ClipboardCheck, label: "Autoresolutorio", color: "bg-[#64AF59] hover:bg-[#52934a]", action: 'autoresolutorio' },
    { icon: Award, label: "Certificado JAC", color: "bg-[#64AF59] hover:bg-[#52934a]", action: 'certificadoJAC' },
    { icon: Award, label: "Certificado JVC", color: "bg-[#64AF59] hover:bg-[#52934a]", action: 'certificadoJVC' },
    { icon: Database, label: "Organismo Comunal", color: "bg-[#E43440] hover:bg-[#52934a]", ruta: `/juntas/datos-junta/${id}` },
  ];


  const generatePdfForDocumento = async (documento, tipo = 'autoresolutorio') => {
    if (!documento) {
      AlertMessage.info('No hay documento disponible para generar el certificado.');
      return;
    }

    const API_BASE = import.meta.env.VITE_PATH || '';
    const endpoint = `${API_BASE}/certificados`;

    const payload = {
      Cedula: documento,
      tipo: tipo
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error generando PDF:', res.status, text);
        AlertMessage.error('Error al generar el PDF: ' + res.status);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      const filename = `certificado_${documento}_${tipo}.pdf`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Excepción al generar PDF:', e);
      AlertMessage.error('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
    }
  };

  const generatePdfForJunta = async (IDJunta, tipo = 'autoresolutorio') => {
    if (!IDJunta) {
      AlertMessage.success('No hay ID de junta disponible para generar el certificado.');
      return;
    }

    const API_BASE = import.meta.env.VITE_PATH || '';
    const endpoint = `${API_BASE}/certificados`;

    const payload = {
      IDJunta,
      tipo
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Error generando PDF para junta:', res.status, text);
        AlertMessage.error('Error al generar el PDF: ' + res.status);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      const filename = `certificado_junta_${IDJunta}_${tipo}.pdf`;
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Excepción al generar PDF para junta:', e);
      AlertMessage.error('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
    }
  };

  const handleEliminarMiembro = async (documento) => {
    const result = await AlertMessage.confirm(
      "¿Eliminar mandatario?",
      "Esta acción no se puede deshacer. ¿Deseas continuar?"
    );

    if (!confirm) return;

    try {
      const resp = await fetch(import.meta.env.VITE_PATH + `/mandatario/${documento}`, {
        method: "DELETE",
      });

      const data = await resp.json();

      if (!resp.ok) {
        return AlertMessage.error("Error", data.message || "No se pudo eliminar el mandatario");
      }

      AlertMessage.success("Eliminado", "El mandatario fue eliminado exitosamente");


      setMiembros(prev => prev.filter(m => m.documento !== documento));

    } catch (e) {
      AlertMessage.error("Error", "No se pudo comunicar con el servidor");
    }
  };



  const cargosUnicos = [...new Set(miembros.map(m => m.cargo))];
  const periodosUnicos = [...new Set(miembros.map(m => m.periodo))];
  const comisionesUnicas = [...new Set(miembros.map(m => m.comision))];


  const miembrosFiltrados = miembros.filter(miembro => {
    const cumpleBusqueda =
      miembro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.documento.includes(searchTerm) ||
      miembro.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      miembro.profesion.toLowerCase().includes(searchTerm.toLowerCase());

    const cumpleFiltros =
      (!filtros.cargo || miembro.cargo === filtros.cargo) &&
      (!filtros.periodo || miembro.periodo === filtros.periodo) &&
      (!filtros.genero || miembro.genero === filtros.genero) &&
      (!filtros.comision || miembro.comision === filtros.comision);

    return cumpleBusqueda && cumpleFiltros;
  });

  const limpiarFiltros = () => {
    setFiltros({
      cargo: "",
      periodo: "",
      genero: "",
      comision: ""
    });
    setSearchTerm("");
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v !== "") || searchTerm !== "";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar de acciones */}
      <aside className="w-64 bg-white border-r border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Acciones Rápidas</h3>
        <nav className="space-y-3">
          {acciones.map((accion, idx) => {
            const Icon = accion.icon;

            const handleClick = () => {
              if (accion.ruta) return navigate(accion.ruta);
    
              const tipo = accion.action || 'autoresolutorio';
              return generatePdfForJunta(juntaIdFromRoute, tipo);
            };

            return (
              <button
                key={idx}
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-white ${accion.color} transition-all shadow-sm hover:shadow-md`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{accion.label}</span>
              </button>
            );
          })}

        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Detalle de la Junta</h1>
                <p className="text-gray-500 mt-1">Gestión de mandatarios y miembros</p>
              </div>
              <button
                onClick={() => navigate(`/juntas/${id}/mandatario/buscar`)}
                className="flex items-center gap-2 bg-[#64AF59] hover:bg-[#52934a] text-white px-5 py-3 rounded-lg font-medium shadow-md transition-all"
              >
                <UserPlus size={20} />
                Nuevo Mandatario
              </button>

            </div>
          </div>

          {/* Barra de búsqueda y filtros */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Buscador */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, apellido, documento, cargo o profesión..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                />
              </div>

              {/* Botón de filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${mostrarFiltros
                  ? 'bg-[#E43440] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <Filter size={20} />
                Filtros {hayFiltrosActivos && `(${Object.values(filtros).filter(v => v).length})`}
              </button>

              {/* Botón limpiar */}
              {hayFiltrosActivos && (
                <button
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                  Limpiar
                </button>
              )}
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Filtrar por:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Filtro Cargo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                    <select
                      value={filtros.cargo}
                      onChange={(e) => setFiltros({ ...filtros, cargo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                    >
                      <option value="">Todos</option>
                      {cargosUnicos.map(cargo => (
                        <option key={cargo} value={cargo}>{cargo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Periodo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                    <select
                      value={filtros.periodo}
                      onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                    >
                      <option value="">Todos</option>
                      {periodosUnicos.map(periodo => (
                        <option key={periodo} value={periodo}>{periodo}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro Género */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Género</label>
                    <select
                      value={filtros.genero}
                      onChange={(e) => setFiltros({ ...filtros, genero: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                    >
                      <option value="">Todos</option>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>

                  {/* Filtro Comisión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comisión</label>
                    <select
                      value={filtros.comision}
                      onChange={(e) => setFiltros({ ...filtros, comision: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                    >
                      <option value="">Todas</option>
                      {comisionesUnicas.map(comision => (
                        <option key={comision} value={comision}>{comision}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Resultados */}
            <div className="mt-4 text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{miembrosFiltrados.length}</span> de <span className="font-semibold text-gray-900">{miembros.length}</span> miembros
            </div>
          </div>

          {/* Cards de miembros */}
          {miembrosFiltrados.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Search className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No se encontraron resultados</h3>
              <p className="text-gray-500">Intenta ajustar los filtros o términos de búsqueda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {miembrosFiltrados.map((m, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header del card */}
                  <div className="bg-gradient-to-r from-[#009E76] to-[#64AF59] px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                          <p className="text-white font-bold text-lg">
                            {m.cargo || m.comision}
                          </p>

                        </div>
                        <div className="text-white">
                          <p className="font-semibold text-lg">{m.nombre} {m.apellido}</p>
                          <p className="text-white/80 text-sm">{m.profesion}</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          navigate(`/juntas/mandatario/editar/${id}/${m.documento}`, { state: { miembro: m } })
                        }
                        className="bg-white/20 hover:bg-white/30 p-2.5 rounded-lg"
                      >
                        <Edit2 size={20} className="text-white" />
                      </button>

                      {/* Botón eliminar */}
                      <button
                        onClick={() => handleEliminarMiembro(m.documento)}
                        className="bg-white/20 hover:bg-red-500/40 p-2.5 rounded-lg transition"
                      >
                        <Trash2 size={20} className="text-white" />
                      </button>

                    </div>
                  </div>

                  {/* Contenido del card */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Información personal */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Información Personal</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo Documento:</span>
                            <span className="text-sm font-medium text-gray-900">{m.tipoDoc}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Numero Documento:</span>
                            <span className="text-sm font-medium text-gray-900"> {m.documento}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Expedido:</span>
                            <span className="text-sm font-medium text-gray-900">{m.expedido}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Género:</span>
                            <span className="text-sm font-medium text-gray-900">{m.genero === 'M' ? 'Masculino' : 'Femenino'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Edad:</span>
                            <span className="text-sm font-medium text-gray-900">{m.edad} años</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Nacimiento:</span>
                            <span className="text-sm font-medium text-gray-900">{m.nacimiento}</span>
                          </div>
                        </div>
                      </div>

                      {/* Información de cargo */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Cargo y Comisión</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Comisión:</span>
                            <span className="text-sm font-medium text-gray-900">{m.comision}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Periodo:</span>
                            <span className="text-sm font-medium text-gray-900">{m.periodo}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fecha Inicio Periodo Mandato:</span>
                            <span className="text-sm font-medium text-gray-900">{formatear(m.inicioMandato)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Fecha Fin Periodo Mandato:</span>
                            <span className="text-sm font-medium text-gray-900">{formatear(m.finMandato)}</span>
                          </div>

                        </div>
                      </div>

                      {/* Información de contacto */}
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Contacto</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{m.residencia}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{m.telefono}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-900 truncate">{m.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}