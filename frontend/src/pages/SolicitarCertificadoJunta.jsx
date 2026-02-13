import { useState, useEffect } from "react";
import { Search, Filter, ExternalLink, FileSearch, Mail, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import Select from "react-select";

export default function SolicitarCertificadoJunta() {
    const navigate = useNavigate();

    const [filtros, setFiltros] = useState({ tipoJunta: "", municipio: "" });
    const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);
    const [juntas, setJuntas] = useState([]);
    const [consultado, setConsultado] = useState(false);
    const [tiposJunta, setTiposJunta] = useState([]);
    const [enviando, setEnviando] = useState(null); // Estado para loading por fila

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resLugares, resInst, resTipos] = await Promise.all([
                    fetch(import.meta.env.VITE_PATH + "/lugares"),
                    fetch(import.meta.env.VITE_PATH + "/instituciones"),
                    fetch(import.meta.env.VITE_PATH + "/tipojunta"),
                ]);

                const lugaresData = await resLugares.json();
                const deptoBoyaca = lugaresData.find(l => l.NombreLugar === "Boyacá" && l.TipoLugar === "Departamento");

                if (deptoBoyaca) {
                    const provinciasBoyacaIds = lugaresData.filter(l => l.TipoLugar === "Provincia" && l.idotrolugar === deptoBoyaca.IDLugar).map(p => p.IDLugar);
                    const soloMunicipiosBoyaca = lugaresData.filter(l => l.TipoLugar === "Municipio" && provinciasBoyacaIds.includes(l.idotrolugar));
                    setMunicipiosFiltrados(soloMunicipiosBoyaca);
                }
                setTiposJunta(await resTipos.json());
            } catch (error) {
                AlertMessage.error("Error", "No fue posible obtener la información");
            }
        };
        fetchData();
    }, []);

    const opcionesMunicipios = municipiosFiltrados.map(m => ({ value: m.IDLugar, label: m.NombreLugar })).sort((a, b) => a.label.localeCompare(b.label));

    const handleConsultar = async () => {
        if (!filtros.tipoJunta || !filtros.municipio) {
            return AlertMessage.error("Filtros incompletos", "Debe seleccionar tipo de junta y municipio");
        }
        try {
            const resp = await fetch(import.meta.env.VITE_PATH + `/juntas?tipoJunta=${filtros.tipoJunta}&idMunicipio=${filtros.municipio}`);
            const data = await resp.json();
            setJuntas(data);
            setConsultado(true);
        } catch (e) {
            AlertMessage.error("Error de conexión", "No se pudo comunicar con el servidor");
        }
    };

    // --- NUEVA FUNCIÓN PARA ENVIAR CORREO ---
    const handleEnviarCorreo = async (junta) => {
        setEnviando(junta.IDJunta); // Activar loading para esta junta
        try {
            const response = await fetch(import.meta.env.VITE_PATH + "/certificados/solicitar", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ IDJunta: junta.IDJunta })
            });

            const result = await response.json();

            if (response.ok) {
                AlertMessage.success(
                    "Correo enviado exitosamente", 
                    "Solicite la copia del certificado al encargado de la Junta."
                );
            } else {
                AlertMessage.error("Error", result.error || "No se pudo enviar el correo");
            }
        } catch (error) {
            AlertMessage.error("Error", "Fallo al conectar con el servidor de correos");
        } finally {
            setEnviando(null); // Desactivar loading
        }
    };

    const handleVerDetalle = async (junta) => {
        if (junta.Activo === false) {
            const confirm = await AlertMessage.confirm("Junta Desactivada", "¿Desea ver los detalles de una junta inactiva?");
            if (!confirm) return;
        }
        navigate(`/juntas/detalle-junta/${junta.IDJunta}`, { state: { junta } });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header & Filtros (Mantener igual que tu código original) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FileSearch className="text-[#009E76]" size={32} />
                        <h1 className="text-3xl font-bold text-gray-800">Solicitar Certificado</h1>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-end">
                        <div>
                            <label className="block text-sm font-semibold mb-2">Tipo de Junta</label>
                            <select 
                                value={filtros.tipoJunta} 
                                onChange={(e) => setFiltros({...filtros, tipoJunta: e.target.value})}
                                className="w-full border rounded-lg px-4 py-2"
                            >
                                <option value="">Seleccione...</option>
                                {tiposJunta.map(t => <option key={t.IDTipoJuntas} value={t.IDTipoJuntas}>{t.NombreTipoJunta}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Municipio</label>
                            <Select 
                                options={opcionesMunicipios} 
                                onChange={(s) => setFiltros({...filtros, municipio: s.value})}
                                placeholder="Buscar municipio..."
                            />
                        </div>
                        <button onClick={handleConsultar} className="bg-[#009E76] text-white px-6 py-2.5 rounded-lg font-semibold">
                            Consultar
                        </button>
                    </div>
                </div>

                {/* Resultados */}
                {consultado && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-[#009E76] text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left">Razón Social</th>
                                    <th className="px-6 py-4 text-left">Personería</th>
                                    <th className="px-6 py-4 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {juntas.map((junta) => (
                                    <tr key={junta.IDJunta} className="border-t hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium">{junta.RazonSocial}</td>
                                        <td className="px-6 py-4">{junta.NumPersoneriaJuridica}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-4">
                                                {/* BOTÓN ENVIAR CORREO */}
                                                <button
                                                    onClick={() => handleEnviarCorreo(junta)}
                                                    disabled={enviando === junta.IDJunta || junta.Activo === false}
                                                    className={`flex items-center gap-1 font-semibold ${
                                                        junta.Activo === false ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'
                                                    }`}
                                                    title="Enviar certificado al correo de la junta"
                                                >
                                                    {enviando === junta.IDJunta ? (
                                                        <Loader2 className="animate-spin" size={18} />
                                                    ) : (
                                                        <Mail size={18} />
                                                    )}
                                                    Enviar Correo
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}