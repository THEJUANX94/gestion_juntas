import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ConsultarJunta() {
    const [filtros, setFiltros] = useState({
        tipoJunta: "",
        municipio: "",
    });

    const [municipios, setMunicipios] = useState([]);
    const [juntas, setJuntas] = useState([]);

    // Simulación de datos
    useEffect(() => {
        setMunicipios([
            { id: "1", nombre: "Tunja" },
            { id: "2", nombre: "Duitama" },
            { id: "3", nombre: "Sogamoso" },
        ]);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiltros((prev) => ({ ...prev, [name]: value }));
    };

    const handleConsultar = (e) => {
        e.preventDefault();

        // Simulación de resultados
        const datosSimulados = [
            {
                razonSocial: "JAC Barrio Libertador",
                fechaCreacion: "2020-05-12",
                fechaExpedida: "2020-05-14",
                reconocida: "Sí",
                numPersoneria: "PJ-0456",
            },
            {
                razonSocial: "JAC Vereda La Florida",
                fechaCreacion: "2019-10-08",
                fechaExpedida: "2019-10-12",
                reconocida: "No",
                numPersoneria: "PJ-0378",
            },
        ];

        setJuntas(datosSimulados);
    };

    return (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
            <h2 className="text-3xl font-bold text-center mb-8 text-[var(--color-text-color-sidebar-pr)]">
                Consultar Juntas de Acción Comunal
            </h2>

            {/* Filtros */}
            <form
                onSubmit={handleConsultar}
                className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                    {/* Tipo de Junta */}
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">
                            Tipo de Junta
                        </label>
                        <select
                            name="tipoJunta"
                            value={filtros.tipoJunta}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
                        >
                            <option value="">Seleccione...</option>
                            <option value="Asociacion Comunal de Juntas">Asociacion Comunal de Juntas</option>
                            <option value="Junta de Accion Comunal">Junta de Accion Comunal</option>
                            <option value="Junta de Vivienda Comunitaria">Junta de Vivienda Comunitaria</option>
                        </select>
                    </div>

                    {/* Municipio */}
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700">
                            Municipio
                        </label>
                        <select
                            name="municipio"
                            value={filtros.municipio}
                            onChange={handleChange}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
                        >
                            <option value="">Seleccione...</option>
                            {municipios.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Botón */}
                    <div className="flex justify-center md:justify-start">
                        <button
                            type="submit"
                            className="bg-[var(--color-hover-text)] text-white font-semibold px-6 py-2 rounded-lg shadow hover:opacity-90 transition"
                        >
                            Consultar
                        </button>
                    </div>
                </div>
            </form>

            {/* Tabla de resultados */}
            <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <thead className="bg-[var(--color-hover-text)] text-white">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Razón Social</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Fecha Expedida</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Fecha Creación</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Reconocida</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold">Personería N°</th>
                        </tr>
                    </thead>

                    <tbody>
                        {juntas.length > 0 ? (
                            juntas.map((junta, index) => (
                                <tr
                                    key={index}
                                    className={`${index % 2 === 0 ? "bg-white" : "bg-gray-50"
                                        } border-t border-gray-200`}
                                >
                                    <td className="px-4 py-3 text-sm text-[var(--color-hover-text)] font-semibold hover:underline">
                                        <Link to={`/detalle-junta/${index}`}>{junta.razonSocial}</Link>
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">{junta.fechaExpedida}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{junta.fechaCreacion}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{junta.reconocida}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{junta.numPersoneria}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="5"
                                    className="text-center text-gray-500 py-6 italic"
                                >
                                    No se encontraron juntas para los filtros seleccionados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
