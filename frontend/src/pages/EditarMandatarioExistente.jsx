import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User, MapPin, Building2, Calendar, Briefcase } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function EditarMandatarioExistente() {
    const { idJunta, idUsuario } = useParams();
    const navigate = useNavigate();

    const [usuario, setUsuario] = useState(null);
    const [cargos, setCargos] = useState([]);
    const [comisiones, setComisiones] = useState([]);
    const [miembros, setMiembros] = useState([]);
    const [modo, setModo] = useState("cargo");
    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({
        Residencia: "",
        Profesion: "",
        IDCargo: "",
        IDComision: "",
        fInicioPeriodo: "",
        fFinPeriodo: "",
    });

    const CARGOS_UNICOS = ["Presidente", "Vicepresidente", "Tesorero", "Fiscal", "Secretario (a)"];
    const cargosOcupados = miembros
        .filter(m => CARGOS_UNICOS.includes(m.cargo))
        .map(m => m.cargo);

    useEffect(() => {
        const cargarTodo = async () => {
            try {
                const auth = JSON.parse(localStorage.getItem("auth"));
                const token = auth?.token;
                const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

                const [resUsuario, resCargos, resCom, resMiembros, resJunta, resProfesion] = await Promise.all([
                    fetch(import.meta.env.VITE_PATH + `/usuarios/${idUsuario}`, { method: "GET", credentials: "include", headers }),
                    fetch(import.meta.env.VITE_PATH + "/cargos"),
                    fetch(import.meta.env.VITE_PATH + "/comisiones"),
                    fetch(import.meta.env.VITE_PATH + `/mandatario/${idJunta}/miembros`),
                    fetch(import.meta.env.VITE_PATH + `/juntas/${idJunta}`),
                    fetch(import.meta.env.VITE_PATH + `/mandatario/profesion/${idUsuario}`, { method: "GET", credentials: "include", headers }),
                ]);

                if (resUsuario.ok) {
                    setUsuario(await resUsuario.json());
                }

                setCargos(await resCargos.json());
                setComisiones(await resCom.json());
                setMiembros(await resMiembros.json());

                const juntaData = await resJunta.json();
                const profesionData = resProfesion.ok ? await resProfesion.json() : null;

                setForm(prev => ({
                    ...prev,
                    Profesion: profesionData?.Profesion || "",
                    fInicioPeriodo: juntaData.FechaInicioPeriodo ? juntaData.FechaInicioPeriodo.split('T')[0] : "",
                    fFinPeriodo: juntaData.FechaFinPeriodo ? juntaData.FechaFinPeriodo.split('T')[0] : "",
                }));
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        cargarTodo();
    }, [idUsuario, idJunta]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCambiarModo = (nuevoModo) => {
        setModo(nuevoModo);
        setForm(prev => ({ ...prev, IDCargo: "", IDComision: "" }));
    };

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

                <div className="space-y-6">

                    {/* Residencia — texto libre */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
                            <MapPin size={18} />
                            Residencia
                        </label>
                        <input
                            type="text"
                            name="Residencia"
                            placeholder="Ej: Tunja, Boyacá"
                            value={form.Residencia}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
                        />
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
                            placeholder="Ej: Abogado, Ingeniero..."
                            value={form.Profesion}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
                        />
                    </div>

                    {/* Switch Cargo / Comisión */}
                    <div>
                        <label className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
                            <Building2 size={18} />
                            Asignar como:
                        </label>
                        <div className="flex gap-3 mb-4">
                            <button
                                type="button"
                                onClick={() => handleCambiarModo("cargo")}
                                className={`px-4 py-1.5 rounded-lg border font-medium transition-all ${
                                    modo === "cargo"
                                        ? "bg-[#009E76] text-white border-[#009E76]"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-[#009E76]"
                                }`}
                            >
                                Cargo
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCambiarModo("comision")}
                                className={`px-4 py-1.5 rounded-lg border font-medium transition-all ${
                                    modo === "comision"
                                        ? "bg-[#009E76] text-white border-[#009E76]"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-[#009E76]"
                                }`}
                            >
                                Comisión
                            </button>
                        </div>

                        {modo === "cargo" ? (
                            <select
                                name="IDCargo"
                                value={form.IDCargo}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
                            >
                                <option value="">Seleccione un cargo</option>
                                {cargos.map((c) => (
                                    <option
                                        key={c.IDCargo}
                                        value={c.IDCargo}
                                        disabled={cargosOcupados.includes(c.NombreCargo)}
                                    >
                                        {c.NombreCargo}{cargosOcupados.includes(c.NombreCargo) ? " (Ocupado)" : ""}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <select
                                name="IDComision"
                                value={form.IDComision}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
                            >
                                <option value="">Seleccione una comisión</option>
                                {comisiones.map((c) => (
                                    <option key={c.IDComision} value={c.IDComision}>
                                        {c.Nombre}
                                    </option>
                                ))}
                            </select>
                        )}
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
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
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
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#009E76] outline-none"
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
