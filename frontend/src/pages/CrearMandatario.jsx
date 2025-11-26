import { useState, useEffect } from "react";
import { UserPlus, Save } from "lucide-react";
import { useParams } from "react-router-dom";

export default function AgregarMandatario() {

  const { id } = useParams();

  const [modo, setModo] = useState("cargo");


  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [comisiones, setComisiones] = useState([]);


  const [formData, setFormData] = useState({
    // Datos Personales
    documento: "",
    tipoDocumento: "C.C",
    expedido: "",
    nombre: "",
    apellido: "",
    genero: "",
    fNacimiento: "",
    residencia: "",
    telefono: "",
    profesion: "",
    email: "",

    // Datos Junta
    fAfiliacion: "",
    periodo: "2022-2026",
    cargo: "",
    comision: ""
  });

  useEffect(() => {
    const cargarDatos = async () => {
      const resTipoDoc = await fetch("http://localhost:3000/api/tipodocumento");
      const resCargos = await fetch("http://localhost:3000/api/cargos");
      const resComisiones = await fetch("http://localhost:3000/api/comisiones");

      setTiposDocumento(await resTipoDoc.json());
      setCargos(await resCargos.json());
      setComisiones(await resComisiones.json());
    };

    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/mandatario/crear/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });


      const data = await res.json();

      if (!res.ok) {
        alert("Error: " + data.message);
        return;
      }

      alert("Mandatario creado correctamente");
      console.log("Respuesta:", data);

    } catch (error) {
      console.error(error);
      alert("Error de conexión al servidor");
    }
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">

            {/* DATOS PERSONALES */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">
                Datos Personales
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                {/* Documento */}
                <Input label="Documento" name="documento" value={formData.documento} onChange={handleChange} />

                {/* Tipo Documento */}
                <Select
                  label="Tipo Documento"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  options={tiposDocumento.map(t => ({ value: t.IDTipoDocumento, label: t.NombreTipo }))}
                />

                {/* Expedido */}
                <Input label="Expedido" name="expedido" value={formData.expedido} onChange={handleChange} />

                {/* Nombre */}
                <Input label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} />

                {/* Apellido */}
                <Input label="Apellido" name="apellido" value={formData.apellido} onChange={handleChange} />

                {/* Género */}
                <Select
                  label="Género"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  options={["Masculino", "Femenino", "Otro"]}
                />

                {/* Fecha nacimiento */}
                <Input type="date" label="F Nacimiento" name="fNacimiento"
                  value={formData.fNacimiento} onChange={handleChange}
                />

                {/* Residencia */}
                <Input label="Residencia" name="residencia" value={formData.residencia} onChange={handleChange} />

                {/* Teléfono */}
                <Input label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />

                {/* Profesión */}
                <Input label="Profesión" name="profesion" value={formData.profesion} onChange={handleChange} />

                {/* Email */}
                <Input type="email" label="Email" name="email" value={formData.email} onChange={handleChange} />

              </div>
            </div>

            {/* DATOS JUNTA */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">
                Datos Junta
              </h3>

              {/* Switch cargo / comisión */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-semibold">Asignar como:</span>

                <button
                  onClick={() => setModo("cargo")}
                  className={`px-4 py-1.5 rounded-lg border ${modo === "cargo" ? "bg-[#009E76] text-white" : "bg-white"}`}
                >
                  Cargo
                </button>

                <button
                  onClick={() => setModo("comision")}
                  className={`px-4 py-1.5 rounded-lg border ${modo === "comision" ? "bg-[#009E76] text-white" : "bg-white"}`}
                >
                  Comisión
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">

                {/* fecha afiliación */}
                <Input
                  type="date"
                  label="F Afiliación"
                  name="fAfiliacion"
                  value={formData.fAfiliacion}
                  onChange={handleChange}
                />

                {/* periodo */}
                <Select
                  label="Periodo"
                  name="periodo"
                  value={formData.periodo}
                  onChange={handleChange}
                  options={["2022-2026", "2018-2022", "2014-2018"]}
                />

                {/* SEGÚN SWITCH */}
                {modo === "cargo" ? (
                  <Select
                    label="Cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    options={cargos.map(c => ({ value: c.IDCargo, label: c.NombreCargo }))}
                  />
                ) : (
                  <Select
                    label="Comisión"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    options={comisiones.map(c => ({ value: c.IDComision, label: c.Nombre }))}
                  />
                )}
              </div>

              {/* BOTÓN */}
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

/* ---------- COMPONENTES DE INPUT LIMPIOS ---------- */

function Input({ label, name, value, onChange, type = "text" }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-semibold text-gray-700 w-32 text-right">{label}:</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="flex-1 border border-gray-300 rounded px-3 py-1.5 focus:ring-2 focus:ring-[#009E76] outline-none"
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-semibold text-gray-700 w-32 text-right">
        {label}:
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white focus:ring-2 focus:ring-[#009E76] outline-none"
      >
        <option value="">Seleccione...</option>

        {options.map((op, index) => {
          // Si es string → lo convertimos
          const value = typeof op === "string" ? op : op.value;
          const label = typeof op === "string" ? op : op.label;

          return (
            <option key={index} value={value}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

