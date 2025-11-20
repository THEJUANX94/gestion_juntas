import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function DetalleJunta() {
  const { id } = useParams();
  const [miembros, setMiembros] = useState([]);

  useEffect(() => {
    // Simulación de llamada al backend
    const datosSimulados = [
      {
        cargo: "Presidente",
        comision: "Otra",
        periodo: "2022-2026",
        tipoDoc: "C.C",
        documento: "4047012",
        expedido: "ALMEIDA",
        nombre: "GILBERTO",
        apellido: "SEGURA PARRA",
        genero: "M",
        edad: 60,
        nacimiento: "1962-05-30",
        residencia: "CENTRO",
        telefono: "3227126139",
        profesion: "AGRICULTOR",
        email: "seguraniogil@yahoo.es",
      },
      {
        cargo: "Vicepresidente",
        comision: "Otra",
        periodo: "2022-2026",
        tipoDoc: "C.C",
        documento: "1049610490",
        expedido: "TUNJA",
        nombre: "NURY STELLA",
        apellido: "DAZA CASTAÑEDA",
        genero: "F",
        edad: 35,
        nacimiento: "1987-04-04",
        residencia: "BARRIO SAUCES",
        telefono: "3212537301",
        profesion: "AUXILIAR ADMINISTRATIVA",
        email: "nuesdaca1523@gmail.com",
      },
    ];
    setMiembros(datosSimulados);
  }, [id]);

  return (
    <div className="max-w-7xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      <h2 className="text-3xl font-bold text-center mb-8 text-[var(--color-text-color-sidebar-pr)]">
        Detalle de la Junta
      </h2>

      {/* Botones superiores */}
      <div className="flex flex-wrap gap-3 justify-center mb-8">
        {[
          "Consulta",
          "Autoresolutorio",
          "Autoresolutorio 24",
          "Certificado JAC",
          "Certificado JVC",
          "Cargar Autoresolutorio",
          "Datos Junta",
          "Nuevo Mandatario",
        ].map((btn) => (
          <button
            key={btn}
            className="bg-[var(--color-hover-text)] text-white px-4 py-2 rounded-lg text-sm shadow hover:opacity-90 transition"
          >
            {btn}
          </button>
        ))}
      </div>

      {/* Tabla de miembros */}
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg shadow-sm">
          <thead className="bg-[var(--color-hover-text)] text-white">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-semibold">Editar</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Cargo</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Comisión</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Periodo</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">T. Do</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Documento</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Expedido</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Nombre</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Apellido</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Género</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Edad</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">F. Nacimiento</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Residencia</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Teléfono</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Profesión</th>
              <th className="px-3 py-2 text-left text-sm font-semibold">Email</th>
            </tr>
          </thead>

          <tbody>
            {miembros.map((m, i) => (
              <tr
                key={i}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"} border-t border-gray-200`}
              >
                <td className="px-3 py-2 text-blue-600 underline cursor-pointer">Editar</td>
                <td className="px-3 py-2 text-sm">{m.cargo}</td>
                <td className="px-3 py-2 text-sm">{m.comision}</td>
                <td className="px-3 py-2 text-sm">{m.periodo}</td>
                <td className="px-3 py-2 text-sm">{m.tipoDoc}</td>
                <td className="px-3 py-2 text-sm">{m.documento}</td>
                <td className="px-3 py-2 text-sm">{m.expedido}</td>
                <td className="px-3 py-2 text-sm">{m.nombre}</td>
                <td className="px-3 py-2 text-sm">{m.apellido}</td>
                <td className="px-3 py-2 text-sm">{m.genero}</td>
                <td className="px-3 py-2 text-sm">{m.edad}</td>
                <td className="px-3 py-2 text-sm">{m.nacimiento}</td>
                <td className="px-3 py-2 text-sm">{m.residencia}</td>
                <td className="px-3 py-2 text-sm">{m.telefono}</td>
                <td className="px-3 py-2 text-sm">{m.profesion}</td>
                <td className="px-3 py-2 text-sm">{m.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
