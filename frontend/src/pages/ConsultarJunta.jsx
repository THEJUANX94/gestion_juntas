import { useState, useEffect } from "react";
import { Search, Filter, ExternalLink, FileSearch, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom"; // 1. Importar useNavigate
import { AlertMessage } from "../components/ui/AlertMessage";
import Select from "react-select";

export default function ConsultarJunta() {
    const navigate = useNavigate(); // 2. Inicializar hook de navegación

    const [filtros, setFiltros] = useState({
        tipoJunta: "",
        municipio: "",
    });

    const [municipios, setMunicipios] = useState([]);
    const [juntas, setJuntas] = useState([]);
    const [consultado, setConsultado] = useState(false);
    const [tiposJunta, setTiposJunta] = useState([]);

    const opcionesMunicipios = municipios.map(m => ({
        value: m.IDLugar,
        label: m.NombreLugar,
    }));

    useEffect(() => {
        const loadData = async () => {
            try {
                const [resMunicipios, resTipos] = await Promise.all([
                    fetch(import.meta.env.VITE_PATH + "/lugares"),
                    fetch(import.meta.env.VITE_PATH + "/tipojunta"),
                ]);

                const munData = await resMunicipios.json();
                const tipoData = await resTipos.json();

                setMunicipios(munData);
                setTiposJunta(tipoData);

            } catch (e) {
                AlertMessage.error("Error", "No se pudieron cargar los datos iniciales");
            }
        };

        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros((prev) => ({ ...prev, [name]: value }));
    };

    const handleConsultar = async () => {
        if (!filtros.tipoJunta || !filtros.municipio) {
            return AlertMessage.error(
                "Filtros incompletos",
                "Debe seleccionar tipo de junta y municipio"
            );
        }

        try {
            const resp = await fetch(
                import.meta.env.VITE_PATH + `/juntas?tipoJunta=${filtros.tipoJunta}&idMunicipio=${filtros.municipio}`
            );

            const data = await resp.json();
            console.log(data);

            if (!resp.ok) {
                return AlertMessage.error("Error", data.message);
            }

            setJuntas(data);
            setConsultado(true);
            AlertMessage.success("Consulta realizada", "Las juntas han sido cargadas");

        } catch (e) {
            AlertMessage.error("Error de conexión", "No se pudo comunicar con el servidor");
        }
    };

    const limpiarFiltros = () => {
        setFiltros({ tipoJunta: "", municipio: "" });
        setJuntas([]);
        setConsultado(false);
    };

    const eliminarJunta = async (idJunta) => {
        const confirm = await AlertMessage.confirm(
            "¿Eliminar junta?",
            "Esta acción no se puede deshacer. ¿Desea continuar?"
        );

        if (!confirm) return;

        try {
            const resp = await fetch(import.meta.env.VITE_PATH + `/juntas/${idJunta}`, {
                method: "DELETE",
            });
            const data = await resp.json();

            if (!resp.ok) {
                return AlertMessage.error("Error", data.message || "No se pudo eliminar");
            }

            AlertMessage.success("Eliminada", "La junta fue eliminada exitosamente");
            setJuntas(prev => prev.filter(j => j.IDJunta !== idJunta));

        } catch (e) {
            AlertMessage.error("Error", "No se pudo comunicarse con el servidor");
        }
    };

    // --- NUEVA FUNCIÓN PARA MANEJAR LA NAVEGACIÓN ---
    const handleVerDetalle = async (junta) => {
        // Si activo es false (o null/undefined según tu BD, aquí asumo false explícito)
        if (junta.activo === false) {
            const confirm = await AlertMessage.confirm(
                "Junta Desactivada",
                "Esta junta se encuentra desactivada (período anterior). ¿Aún así desea ver los detalles?"
            );
            if (!confirm) return; // Si cancela, no hace nada
        }

        // Navegación manual enviando el estado
        navigate(`/juntas/detalle-junta/${junta.IDJunta}`, { state: { junta } });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FileSearch className="text-[#009E76]" size={32} />
                        <h1 className="text-3xl font-bold text-gray-800">Consultar Juntas</h1>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Filter className="text-[#009E76]" size={24} />
                        <h3 className="text-xl font-semibold text-gray-800">Filtros de Búsqueda</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-end">
                        {/* Tipo de Junta */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">Tipo de Junta</label>
                            <select
                                name="tipoJunta"
                                value={filtros.tipoJunta}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                            >
                                <option value="">Todos los tipos</option>
                                {tiposJunta.map((t) => (
                                    <option key={t.IDTipoJuntas} value={t.IDTipoJuntas}>
                                        {t.NombreTipoJunta}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Municipio */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                Municipio <span className="text-[#E43440]">*</span>
                            </label>
                            <Select
                                options={opcionesMunicipios}
                                value={opcionesMunicipios.find(o => o.value === filtros.municipio)}
                                onChange={(selected) =>
                                    setFiltros(prev => ({ ...prev, municipio: selected.value }))
                                }
                                placeholder="Selecciona un municipio..."
                                isSearchable={true}
                                className="text-black"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleConsultar}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all flex-1"
                            >
                                <Search size={18} /> Consultar
                            </button>
                            {consultado && (
                                <button
                                    onClick={limpiarFiltros}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-lg transition-all"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>

                    {consultado && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                Se encontraron <span className="font-semibold text-[#009E76]">{juntas.length}</span> resultados
                            </p>
                        </div>
                    )}
                </div>

                {/* Tabla de resultados */}
                {consultado && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gradient-to-r from-[#009E76] to-[#64AF59] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Razón Social</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Fecha Creación</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Expedida por</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Reconocida por</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Personería N°</th>
                                        <th className="px-6 py-4 text-center text-sm font-semibold">Acción</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {juntas.length > 0 ? (
                                        juntas.map((junta, index) => {
                                            // Lógica de estilos para juntas inactivas
                                            const isInactive = junta.activo === false;
                                            const rowClass = isInactive
                                                ? "bg-gray-200 text-gray-500 hover:bg-gray-300" // Estilo Inactiva (Oscura/Gris)
                                                : (index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-blue-50"); // Estilo Activa

                                            return (
                                                <tr key={index} className={`${rowClass} border-t border-gray-200 transition-colors`}>
                                                    <td className={`px-6 py-4 text-sm font-medium ${isInactive ? "text-gray-600" : "text-gray-900"}`}>
                                                        {junta.RazonSocial}
                                                        {isInactive && <span className="ml-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">Inactiva</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {new Date(junta.FechaCreacion).toLocaleDateString("es-CO", {
                                                            year: "numeric", month: "long", day: "numeric",
                                                        })}
                                                    </td>

                                                    <td className="px-6 py-4 text-sm">{junta.Institucion.NombreInstitucion}</td>
                                                    <td className="px-6 py-4 text-sm">{junta.Reconocida?.Nombre}</td>
                                                    <td className="px-6 py-4 text-sm">{junta.NumPersoneriaJuridica}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center gap-4">

                                                            {/* BOTÓN VER DETALLES MODIFICADO */}
                                                            <button
                                                                onClick={() => handleVerDetalle(junta)}
                                                                className={`inline-flex items-center gap-1 font-medium text-sm transition-colors ${isInactive
                                                                        ? "text-gray-600 hover:text-gray-900"
                                                                        : "text-[#009E76] hover:text-[#007d5e]"
                                                                    }`}
                                                            >
                                                                Ver detalles
                                                                <ExternalLink size={16} />
                                                            </button>

                                                            {/* Eliminar */}
                                                            <button
                                                                onClick={() => eliminarJunta(junta.IDJunta)}
                                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                                title="Eliminar junta"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center text-gray-500 py-12">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Search className="text-gray-300" size={48} />
                                                    <p className="text-lg font-medium">No se encontraron juntas</p>
                                                    <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Mensaje inicial */}
                {!consultado && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                        <Search className="mx-auto text-gray-300 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            Seleccione los filtros y presione Consultar
                        </h3>
                        <p className="text-gray-500">
                            Los resultados de búsqueda aparecerán aquí
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}