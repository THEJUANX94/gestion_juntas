import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Building2, Calendar, Users, Save, FileText } from "lucide-react";
import Select from "react-select";

export default function EditarJunta() {

  const { id } = useParams();
  const navigate = useNavigate();

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

  const [numeroAfiliados, setNumeroAfiliados] = useState(0);
  const [lugares, setLugares] = useState([]);
  const [instituciones, setInstituciones] = useState([]);
  const [tiposJunta, setTiposJunta] = useState([]);
  const [loading, setLoading] = useState(true);

  const opcionesMunicipios = lugares.map(l => ({
    value: l.IDLugar,
    label: l.NombreLugar,
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [resLugares, resInst, resTipos] = await Promise.all([
          fetch("http://localhost:3000/api/lugares"),
          fetch("http://localhost:3000/api/instituciones"),
          fetch("http://localhost:3000/api/tipojunta"),
        ]);

        const lugaresData = await resLugares.json();
        const instData = await resInst.json();
        const tiposData = await resTipos.json();

        setLugares(lugaresData);
        setInstituciones(instData);
        setTiposJunta(tiposData);

   
        const resJunta = await fetch(`http://localhost:3000/api/juntas/${id}`);
        const juntaData = await resJunta.json();
   

        setFormData({
          razonSocial: juntaData.RazonSocial,
          direccion: juntaData.Direccion,
          numPersoneriaJuridica: juntaData.NumeroPersoneriaJuridica,
          fechaCreacion: juntaData.FechaCreacion?.split("T")[0] || "",
          zona: juntaData.Zona,
          fechaInicioPeriodo: juntaData.FechaInicioPeriodo?.split("T")[0] || "",
          fechaFinPeriodo: juntaData.FechaFinPeriodo?.split("T")[0] || "",
          fechaAsamblea: juntaData.FechaAsamblea?.split("T")[0] || "",
          tipoJunta: juntaData.IDTipoJunta,
          idMunicipio: juntaData.IDMunicipio,
          idInstitucion: juntaData.IDInstitucion,
        });

        setNumeroAfiliados(juntaData.NumeroAfiliados || 0);

      } catch (error) {
        console.error("Error cargando datos:", error);
        alert("Error al cargar datos de la junta");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);


  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (name === "numPersoneriaJuridica") {
      if (!/^\d*$/.test(value)) return;
    }

    const finalValue = type === "text" ? value.toUpperCase() : value;

  
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));


    if (name === "fechaInicioPeriodo") {


      if (!value) {
        setFormData(prev => ({
          ...prev,
          fechaInicioPeriodo: "",
          fechaFinPeriodo: ""
        }));
        return;
      }

      const fechaInicio = new Date(value);

      if (isNaN(fechaInicio.getTime())) {
        console.warn("Fecha inválida:", value);
        return;
      }

      const fechaFin = new Date(fechaInicio);
      fechaFin.setFullYear(fechaFin.getFullYear() + 4);

      setFormData(prev => ({
        ...prev,
        fechaInicioPeriodo: value,
        fechaFinPeriodo: fechaFin.toISOString().split("T")[0],
      }));

      return;
    }
  };


  const handleSubmit = async () => {
    try {
      const resp = await fetch(`http://localhost:3000/api/juntas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(`Error: ${data.message}`);
        return;
      }

      alert("Junta actualizada correctamente");
      navigate(`juntas/consultar`);

    } catch (e) {
      alert("Error de conexión con el servidor");
    }
  };


  const municipioSeleccionado = lugares.find(l => l.IDLugar === formData.idMunicipio);
  const institucionSeleccionada = instituciones.find(i => i.IDInstitucion === formData.idInstitucion);
  const tipoSeleccionado = tiposJunta.find(t => t.IDTipoJuntas === formData.tipoJunta);


  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    const [y, m, d] = fecha.split("-");
    return `${d}-${m}-${y}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando datos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="text-[#009E76]" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Editar Junta</h1>
          </div>
          <p className="text-gray-500">Modifique la información de la junta</p>
        </div>

        <div className="space-y-6">

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <FileText className="text-[#009E76]" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Información Actual</h3>
            </div>


            <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="text-[#64AF59]" size={20} />
                <span className="text-sm font-semibold text-gray-700">Número de Afiliados:</span>
                <span className="text-lg font-bold text-[#009E76]">{numeroAfiliados}</span>
              </div>
            </div>


            <div className="border-2 border-[#009E76] rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
              <p className="text-gray-800 leading-relaxed text-justify">
                La<strong className="font-bold text-[#009E76]"> {tipoSeleccionado?.NombreTipoJunta || "N/A"} </strong>
                <strong className="font-bold">{formData.razonSocial || "N/A"}</strong> del municipio de{" "}
                <strong className="font-bold">{municipioSeleccionado?.NombreLugar || "N/A"}</strong>, , del departamento de Boyacá, con Personería Jurídica No.{" "}
                <strong className="font-bold">{formData.numPersoneriaJuridica || "N/A"}</strong> de fecha{" "}
                {formatearFecha(formData.fechaCreacion)}, expedida por{" "}
                {institucionSeleccionada?.NombreInstitucion || "N/A"}, realizó Asamblea General el día{" "}
                {formatearFecha(formData.fechaAsamblea)} con el fin de elegir dignatarios para el período comprendido entre el{" "}
                {formatearFecha(formData.fechaInicioPeriodo)} y el {formatearFecha(formData.fechaFinPeriodo)}.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <Building2 className="text-[#009E76]" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Datos de la Junta</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Municipio <span className="text-[#E43440]">*</span>
                </label>
                <Select
                  options={opcionesMunicipios}
                  value={opcionesMunicipios.find(o => o.value === formData.idMunicipio)}
                  onChange={(selected) =>
                    setFormData(prev => ({ ...prev, idMunicipio: selected.value }))
                  }
                  placeholder="Selecciona un municipio..."
                  isSearchable={true}
                  className="text-black"
                />
              </div>

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
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
              <Calendar className="text-[#64AF59]" size={24} />
              <h3 className="text-xl font-semibold text-gray-800">Datos de la Asamblea</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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


          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => window.history.back()}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg shadow-sm transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-all"
            >
              <Save size={20} />
              Actualizar Junta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}