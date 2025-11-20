import { useState, useEffect } from "react";

export default function CrearJunta() {
  const [formData, setFormData] = useState({
    razonSocial: "",
    direccion: "",
    numPersoneriaJuridica: "",
    fechaCreacion: "",
    zona: "",
    fechaInicioPeriodo: "",
    fechaFinPeriodo: "",
    fechaAsamblea: "",
    tipoJunta: "",
    idMunicipio: "",
    idInstitucion: "",
  });

  const [municipios, setMunicipios] = useState([]);
  const [instituciones, setInstituciones] = useState([]);

  // Simulación de datos
  useEffect(() => {
    setMunicipios([
      { id: "1", nombre: "Tunja" },
      { id: "2", nombre: "Duitama" },
      { id: "3", nombre: "Sogamoso" },
    ]);

    setInstituciones([
      { id: "1", nombre: "Gobernación de Boyacá" },
      { id: "2", nombre: "Secretaría de Gobierno" },
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos de la Junta:", formData);
    alert("Junta creada exitosamente (modo demo)");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-md border border-gray-200">
      {/* Título principal */}
      <h2 className="text-3xl font-bold text-center mb-6 text-[var(--color-text-color-sidebar-pr)]">
        Crear Junta
      </h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección 1: Datos de la Junta */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-[var(--color-hover-text)] border-b pb-2">
            Datos de la Junta
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Municipio */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Municipio</label>
              <select
                name="idMunicipio"
                value={formData.idMunicipio}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
              >
                <option value="">Seleccione un municipio</option>
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Institución */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Institución</label>
              <select
                name="idInstitucion"
                value={formData.idInstitucion}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
              >
                <option value="">Seleccione una institución</option>
                {instituciones.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>

            {/* Tipo de Junta */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Tipo de Junta</label>
              <select
                name="tipoJunta"
                value={formData.tipoJunta}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
              >
                <option value="">Seleccione tipo</option>
                <option value="Comunal">ASOCIACION COMUNAL DE JUNTAS</option>
                <option value="Veredal">JUNTA DE ACCION COMUNAL</option>
                <option value="Barrial">JUNTA DE VIVIENDA COMUNITARIA</option>
              </select>
            </div>

            {/* Razón Social */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Razón Social</label>
              <input
                type="text"
                name="razonSocial"
                value={formData.razonSocial}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>

            {/* N° Personería Jurídica */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">
                N° Personería Jurídica
              </label>
              <input
                type="text"
                name="numPersoneriaJuridica"
                value={formData.numPersoneriaJuridica}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>

            {/* Zona */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Zona</label>
              <select
                name="zona"
                value={formData.zona}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-white focus:ring-2 focus:ring-[var(--color-hover-text)]"
              >
                <option value="">Seleccione una zona</option>
                <option value="Urbana">Urbana</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            {/* Fecha de Creación */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Fecha de Creación</label>
              <input
                type="date"
                name="fechaCreacion"
                value={formData.fechaCreacion}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Datos de la Asamblea */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-[var(--color-hover-text)] border-b pb-2">
            Datos de la Asamblea
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Fecha Asamblea */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Fecha de Asamblea</label>
              <input
                type="date"
                name="fechaAsamblea"
                value={formData.fechaAsamblea}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>

            {/* Fecha Inicio Periodo */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Inicio del Período</label>
              <input
                type="date"
                name="fechaInicioPeriodo"
                value={formData.fechaInicioPeriodo}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>

            {/* Fecha Fin Periodo */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-700">Fin del Período</label>
              <input
                type="date"
                name="fechaFinPeriodo"
                value={formData.fechaFinPeriodo}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-hover-text)]"
              />
            </div>
          </div>
        </div>

        {/* Botón */}
        <div className="flex justify-center pt-4">
          <button
            type="submit"
            className="bg-[var(--color-hover-text)] text-white font-semibold px-8 py-2 rounded-lg shadow hover:opacity-90 transition"
          >
            Crear Junta
          </button>
        </div>
      </form>
    </div>
  );
}
