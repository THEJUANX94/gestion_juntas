import { useState } from "react";
import { UserPlus, Save } from "lucide-react";

export default function AgregarMandatario() {
  const [formData, setFormData] = useState({
    // Datos Personales
    documento: "",
    tipoDocumento: "C.C",
    expedido: "",
    nombre: "",
    apellido: "",
    genero: "",
    edad: "",
    fNacimiento: "",
    residencia: "",
    telefono: "",
    profesion: "",
    email: "",
    // Grupo Poblacional
    indigena: "No",
    afro: "No",
    conDiscapacidad: "No",
    desplazado: "No",
    madreGestante: "No",
    madreLactante: "No",
    cabezaHogar: "No",
    adultoMayor: "No",
    lgbti: "No",
    otraPoblacion: "No",
    // Datos Junta
    numAfiliacion: "",
    fAfiliacion: "",
    periodo: "2022-2026",
    cargo: "",
    comision: "",
    subDireccion: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    console.log("Datos completos:", formData);
    alert("Mandatario guardado exitosamente");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <UserPlus className="text-[#009E76]" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Agregar Mandatario</h1>
          </div>
          <p className="text-gray-500">Complete toda la información del nuevo mandatario</p>
        </div>

        {/* Formulario único */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {/* SECCIÓN: Datos Personales */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">
                Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Documento */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Documento:
                  </label>
                  <input
                    type="text"
                    name="documento"
                    value={formData.documento}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Tipo Documento */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Tipo Documento:
                  </label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  >
                    <option value="C.C">C.C</option>
                    <option value="T.I">T.I</option>
                    <option value="C.E">C.E</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                {/* Expedido */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Expedido:
                  </label>
                  <input
                    type="text"
                    name="expedido"
                    value={formData.expedido}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Nombre */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Nombre:
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Apellido */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Apellido:
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Género */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Género:
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Edad */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Edad:
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* F Nacimiento */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    F Nacimiento:
                  </label>
                  <input
                    type="date"
                    name="fNacimiento"
                    value={formData.fNacimiento}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Residencia */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Residencia:
                  </label>
                  <input
                    type="text"
                    name="residencia"
                    value={formData.residencia}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Teléfono */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Teléfono:
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Profesión */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Profesión:
                  </label>
                  <input
                    type="text"
                    name="profesion"
                    value={formData.profesion}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>

                {/* Email */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Email:
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN: Grupo Poblacional */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#E43440]">
                Grupo Poblacional
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Indígena */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Indígena:
                  </label>
                  <select
                    name="indigena"
                    value={formData.indigena}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Afro */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Afro:
                  </label>
                  <select
                    name="afro"
                    value={formData.afro}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Con_Disca */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Con_Disca:
                  </label>
                  <select
                    name="conDiscapacidad"
                    value={formData.conDiscapacidad}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Desplazado */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Desplazado:
                  </label>
                  <select
                    name="desplazado"
                    value={formData.desplazado}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Madre_Gest */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Madre_Gest:
                  </label>
                  <select
                    name="madreGestante"
                    value={formData.madreGestante}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Madre_Lact */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Madre_Lact:
                  </label>
                  <select
                    name="madreLactante"
                    value={formData.madreLactante}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Cabeza_Hogar */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Cabeza_Hogar:
                  </label>
                  <select
                    name="cabezaHogar"
                    value={formData.cabezaHogar}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Adul_Mayor */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Adul_Mayor:
                  </label>
                  <select
                    name="adultoMayor"
                    value={formData.adultoMayor}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* LGBTI */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    LGBTI:
                  </label>
                  <select
                    name="lgbti"
                    value={formData.lgbti}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>

                {/* Otra */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Otra:
                  </label>
                  <select
                    name="otraPoblacion"
                    value={formData.otraPoblacion}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#E43440] focus:border-transparent outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Sí">Sí</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECCIÓN: Datos Junta */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">
                Datos Junta
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                {/* Num.Afiliación */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Núm.Afiliación:
                  </label>
                  <input
                    type="text"
                    name="numAfiliacion"
                    value={formData.numAfiliacion}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  />
                </div>

                {/* F Afiliación */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    F Afiliación:
                  </label>
                  <input
                    type="date"
                    name="fAfiliacion"
                    value={formData.fAfiliacion}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  />
                </div>

                {/* Periodo */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Periodo:
                  </label>
                  <select
                    name="periodo"
                    value={formData.periodo}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  >
                    <option value="2022-2026">2022-2026</option>
                    <option value="2018-2022">2018-2022</option>
                    <option value="2014-2018">2014-2018</option>
                  </select>
                </div>

                {/* Cargo */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Cargo:
                  </label>
                  <select
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Presidente">Presidente</option>
                    <option value="Vicepresidente">Vicepresidente</option>
                    <option value="Secretario">Secretario</option>
                    <option value="Tesorero">Tesorero</option>
                    <option value="Fiscal">Fiscal</option>
                  </select>
                </div>

                {/* Comisión */}
                <div className="flex items-center gap-4">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Comisión:
                  </label>
                  <select
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Otra">Otra</option>
                    <option value="Administrativa">Administrativa</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Salud">Salud</option>
                    <option value="Educación">Educación</option>
                  </select>
                </div>

                {/* Sub Dirección */}
                <div className="flex items-center gap-4 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 w-32 text-right">
                    Sub Dirección:
                  </label>
                  <input
                    type="text"
                    name="subDireccion"
                    value={formData.subDireccion}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <div className="w-32"></div>
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#009E76] to-[#64AF59] hover:from-[#007d5e] hover:to-[#52934a] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md transition-all"
                >
                  <Save size={18} />
                  Insertar registro
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}