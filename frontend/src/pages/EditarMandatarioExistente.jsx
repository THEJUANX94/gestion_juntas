import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Briefcase, Building2, Calendar } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function EditarMandatarioExistente() {
    const { idJunta, idUsuario } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [municipios, setMunicipios] = useState([]);
    const [cargos, setCargos] = useState([]);
       const [comisiones, setComisiones] = useState([]);

    const [form, setForm] = useState({
        Residencia: "",
        Profesion: "",
        IDCargo: "",
        IDComision: "",
        fInicioPeriodo: "",
        fFinPeriodo: "",
    });

    const [loading, setLoading] = useState(true);

    // ===============================
    // Cargar datos iniciales
    // ===============================
    useEffect(() => {
        const cargarTodo = async () => {
            try {
                const auth = JSON.parse(localStorage.getItem("auth"));
                const token = auth?.token;

                // 1. Cargar usuario
                const resUsuario = await fetch(import.meta.env.VITE_PATH + `/usuarios/${idUsuario}`, {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                });

                if (resUsuario.ok) {
                    const dataUsu = await resUsuario.json();
                    setUsuario(dataUsu);
                }

                // 2. Cargar municipios
                const resMunicipios = await fetch(import.meta.env.VITE_PATH + "/lugares", {
                    credentials: "include",
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const dataMunicipios = await resMunicipios.json();
                const soloMunicipios = dataMunicipios.filter(
                    (l) => l.TipoLugar?.toLowerCase().trim() === "municipio"
                );
                setMunicipios(soloMunicipios);

                // 3. Cargar cargos
                const resCargos = await fetch(import.meta.env.VITE_PATH + "/cargos");
                const dataCargos = await resCargos.json();
                setCargos(dataCargos);

                // 4. Cargar comisiones
                const resCom = await fetch(import.meta.env.VITE_PATH + "/comisiones");
                const dataCom = await resCom.json();
                setComisiones(dataCom);

                setLoading(false);
            } catch (error) {
                console.error("Error cargando datos:", error);
                setLoading(false);
            }
        };

        cargarTodo();
    }, [idUsuario]);

    // ===============================
    // Manejo de cambios
    // ===============================
const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "IDCargo") {
        setForm((prev) => ({
            ...prev,
            IDCargo: value,
            IDComision: value ? "" : prev.IDComision, 
        }));
        return;
    }

    if (name === "IDComision") {
        setForm((prev) => ({
            ...prev,
            IDComision: value,
            IDCargo: value ? "" : prev.IDCargo, 
        }));
        return;
    }

    setForm({
        ...form,
        [name]: value,
    });
};


    // ===============================
    // Enviar formulario
    // ===============================
    const handleSubmit = async () => {
        try {
            const res = await fetch(
                import.meta.env.VITE_PATH + `/mandatario/agregar-existente/${idJunta}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        IDUsuario: idUsuario,
                        ...form,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                AlertMessage.error(data.message || "Error al guardar");
                return;
            }

            AlertMessage.info("Mandatario agregado exitosamente a la junta");
            navigate(`/juntas/detalle-junta/${idJunta}`);
        } catch (error) {
            console.error(error);
            AlertMessage.error("Error al conectar con el servidor");
        }
    };

    // ===============================
    // Loading
    // ===============================
    if (loading) {
        return (
            <div className="p-10 text-center">
                <div className="animate-spin w-10 h-10 border-4 border-[#009E76] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-600">Cargando datos...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-8 border border-gray-200">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <User size={32} className="text-[#009E76]" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Completar Datos del Mandatario</h1>
                        <p className="text-gray-500">
                            Agregar a:{" "}
                            <span className="font-semibold">
                                {usuario?.PrimerNombre} {usuario?.SegundoNombre}{" "}
                                {usuario?.PrimerApellido} {usuario?.SegundoApellido}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Formulario */}
                <div className="space-y-6">

                    {/* Residencia */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <MapPin size={18} />
                            Residencia
                        </label>
                        <select
                            name="Residencia"
                            value={form.Residencia}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                        >
                            <option value="">Seleccione municipio</option>
                            {municipios.map((m) => (
                                <option key={m.IDLugar} value={m.IDLugar}>
                                    {m.NombreLugar}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Profesión */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Briefcase size={18} />
                            Profesión
                        </label>
                        <input
                            type="text"
                            name="Profesion"
                            placeholder="Ej: Ingeniero, Abogado, Agricultor"
                            value={form.Profesion}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    {/* Cargo */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Building2 size={18} />
                            Cargo
                        </label>
                        <select
                            name="IDCargo"
                            value={form.IDCargo}
                            onChange={handleChange}
                            disabled={!!form.IDComision}
                            className="w-full border rounded-lg p-3"
                        >
                            <option value="">Seleccione un cargo</option>
                            {cargos.map((c) => (
                                <option key={c.IDCargo} value={c.IDCargo}>
                                    {c.NombreCargo}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Comisión */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Building2 size={18} />
                            Comisión
                        </label>
                        <select
                            name="IDComision"
                            value={form.IDComision}
                            onChange={handleChange}
                            disabled={!!form.IDCargo}
                            className="w-full border rounded-lg p-3"
                        >
                            <option value="">Seleccione comisión</option>
                            {comisiones.map((c) => (
                                <option key={c.IDComision} value={c.IDComision}>
                                    {c.Nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Inicio del periodo */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Calendar size={18} />
                            Inicio del periodo
                        </label>
                        <input
                            type="date"
                            name="fInicioPeriodo"
                            value={form.fInicioPeriodo}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                        />
                    </div>

                    {/* Fin del periodo */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <Calendar size={18} />
                            Fin del periodo
                        </label>
                        <input
                            type="date"
                            name="fFinPeriodo"
                            value={form.fFinPeriodo}
                            onChange={handleChange}
                            className="w-full border rounded-lg p-3"
                        />
                    </div>
                </div>

                {/* Botón Guardar */}
                <button
                    onClick={handleSubmit}
                    className="w-full mt-8 bg-[#009E76] hover:bg-[#007d5e] text-white font-semibold py-3 rounded-lg shadow-md transition-all"
                >
                    Guardar y Agregar a la Junta
                </button>
            </div>
        </div>
    );
}
