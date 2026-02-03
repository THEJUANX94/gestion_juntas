import { useState, useEffect } from "react";
import { Building2, Calendar } from "lucide-react";
import { AlertMessage } from "../components/ui/AlertMessage";
import Select from "react-select";



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
    correo: "",
  });

  const [municipiosFiltrados, setMunicipiosFiltrados] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [tiposJunta, setTiposJunta] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLugares, resInst, resTipos] = await Promise.all([
          fetch(import.meta.env.VITE_PATH + "/lugares"),
          fetch(import.meta.env.VITE_PATH + "/instituciones"),
          fetch(import.meta.env.VITE_PATH + "/tipojunta"),
        ]);

        const lugaresData = await resLugares.json();
        const deptoBoyaca = lugaresData.find(
          l => l.NombreLugar === "Boyacá" && l.TipoLugar === "Departamento"
        );

        if (deptoBoyaca) {
          const provinciasBoyacaIds = lugaresData
            .filter(l => l.TipoLugar === "Provincia" && l.idotrolugar === deptoBoyaca.IDLugar)
            .map(p => p.IDLugar);
          const soloMunicipiosBoyaca = lugaresData.filter(
            l => l.TipoLugar === "Municipio" && provinciasBoyacaIds.includes(l.idotrolugar)
          );

          setMunicipiosFiltrados(soloMunicipiosBoyaca);
        }

        setLugares(lugaresData);
        setInstituciones(await resInst.json());
        setTiposJunta(await resTipos.json());

      } catch (error) {
        console.error("Error cargando datos:", error);
        AlertMessage.error("Error", "No fue posible obtener la información");
      }
    };
    fetchData();
  }, []);

  const opcionesMunicipios = municipiosFiltrados.map(m => ({
    value: m.IDLugar,
    label: m.NombreLugar,
  }));

  // ==========================
  // Manejo de inputs
  // ==========================
  const handleChange = (e) => {
    const { name, value, type } = e.target;


    if (name === "numPersoneriaJuridica") {
      if (!/^\d*$/.test(value)) return;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      return;
    }

    const finalValue = type === "text" ? value.toUpperCase() : value;

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));


    if (name === "fechaInicioPeriodo") {
      const fechaInicio = new Date(value);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setFullYear(fechaFin.getFullYear() + 4);

      setFormData(prev => ({
        ...prev,
        fechaInicioPeriodo: value,
        fechaFinPeriodo: fechaFin.toISOString().split("T")[0]
      }));
      return;
    }

  };



  // ==========================
  // Enviar al backend
  // ==========================
  const handleSubmit = async () => {

    if (formData.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      AlertMessage.success("El correo debe tener un dominio válido, como usuario@correo.com");
      return;
    }

    try {
      const resp = await fetch(import.meta.env.VITE_PATH + "/juntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await resp.json();

      if (!resp.ok) {
        return AlertMessage.error(`Error: ${data.message}`);
      }

      AlertMessage.success("Éxito", "Junta creada correctamente");

      setFormData({
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

    } catch (e) {
      AlertMessage.error(
        "Error de conexión",
        "No se pudo conectar con el servidor"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-[#009E76]" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Crear Junta</h1>
          </div>
          <p className="text-gray-500">Complete el formulario para registrar una nueva junta</p>
        </div>

        <div className="space-y-6">
          {/* Sección 1: Datos de la Junta */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <Building2 className="text-[#009E76]" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Datos de la Junta</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lugar */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Municipio <span className="text-[#E43440]">*</span>
                </label>

                <Select
                  options={opcionesMunicipios}
                  value={opcionesMunicipios.find(o => o.value === formData.idMunicipio)}
                  onChange={(selected) =>
                    setFormData(prev => ({ ...prev, idMunicipio: selected?.value }))
                  }
                  placeholder="Selecciona un municipio de Boyacá..."
                  isSearchable={true}
                  className="text-black"
                />
              </div>

              {/* Institución */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Institución <span className="text-[#E43440]">*</span>
                </label>
                <select
                  name="idInstitucion"
                  value={formData.idInstitucion}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                >
                  <option value="">Seleccione una institución</option>
                  {instituciones.map((i) => (
                    <option key={i.IDInstitucion} value={i.IDInstitucion}>
                      {i.NombreInstitucion}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Dirección <span className="text-[#E43440]">*</span>
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Ingrese la dirección"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Tipo de Junta */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Tipo de Junta <span className="text-[#E43440]">*</span>
                </label>
                <select
                  name="tipoJunta"
                  value={formData.tipoJunta}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                >
                  <option value="">Seleccione tipo</option>
                  {tiposJunta.map((t) => (
                    <option key={t.IDTipoJuntas} value={t.IDTipoJuntas}>
                      {t.NombreTipoJunta}
                    </option>
                  ))}
                </select>
              </div>

              {/* Razón Social */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Razón Social <span className="text-[#E43440]">*</span>
                </label>
                <input
                  type="text"
                  name="razonSocial"
                  value={formData.razonSocial}
                  onChange={handleChange}
                  placeholder="Ingrese la razón social"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* N° Personería Jurídica */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  N° Personería Jurídica <span className="text-[#E43440]">*</span>
                </label>
                <input
                  type="text"
                  name="numPersoneriaJuridica"
                  value={formData.numPersoneriaJuridica}
                  onChange={handleChange}
                  placeholder="Ingrese el número"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Zona */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Zona <span className="text-[#E43440]">*</span>
                </label>
                <select
                  name="zona"
                  value={formData.zona}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                >
                  <option value="">Seleccione una zona</option>
                  <option value="Urbana">Urbana</option>
                  <option value="Rural">Rural</option>
                </select>
              </div>

              {/* Fecha de Creación */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Fecha de Creación <span className="text-[#E43440]">*</span>
                </label>
                <input
                  type="date"
                  name="fechaCreacion"
                  value={formData.fechaCreacion}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Correo de la junta */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Correo de la junta <span className="text-[#E43440]">*</span>
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="Ingrese el correo de la junta"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Datos de la Asamblea */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <Calendar className="text-[#64AF59]" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Datos de la Asamblea</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fecha Asamblea */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Fecha de Asamblea
                </label>
                <input
                  type="date"
                  name="fechaAsamblea"
                  value={formData.fechaAsamblea}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Fecha Inicio Periodo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Inicio del Período
                </label>
                <input
                  type="date"
                  name="fechaInicioPeriodo"
                  value={formData.fechaInicioPeriodo}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Fecha Fin Periodo */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Fin del Período
                </label>
                <input
                  type="date"
                  name="fechaFinPeriodo"
                  value={formData.fechaFinPeriodo}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-100 cursor-not-allowed"
                />

              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => AlertMessage.info("Operación cancelada", "No se registró ninguna junta")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg shadow-sm transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-all"
            >
              Crear Junta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}