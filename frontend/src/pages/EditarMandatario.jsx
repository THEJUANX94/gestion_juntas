import { useState, useEffect } from "react";
import { Save, UserCog } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function EditarMandatario() {
  const navigate = useNavigate();
  const { id, documento } = useParams();

  const [modo, setModo] = useState("cargo");
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [comisiones, setComisiones] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [listaGrupos, setListaGrupos] = useState([]);

  const [formData, setFormData] = useState({
    documento: "",
    tipoDocumento: "",
    expedido: "",
    primernombre: "",
    segundonombre: "",
    primerapellido: "",
    segundoapellido: "",
    genero: "",
    fNacimiento: "",
    residencia: "",
    telefono: "",
    profesion: "",
    email: "",
    fInicioPeriodo: "",
    fFinPeriodo: "",
    cargo: "",
    comision: "",
    gruposPoblacionales: [],
    departamento: ""
  });

  const departamentos = lugares.filter(l => l.TipoLugar === 'Departamento');
  const municipiosFiltrados = lugares.filter(l => l.TipoLugar === 'Municipio' && l.IDOtroLugar === formData.departamento);

  // CARGAR DATOS DEL BACKEND
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Cargamos las listas maestras y el mandatario
        const [resLugares, resGrupos, resMand] = await Promise.all([
          fetch(import.meta.env.VITE_PATH + "/lugares"),
          fetch(import.meta.env.VITE_PATH + "/grupospoblacionales"),
          fetch(import.meta.env.VITE_PATH + `/mandatario/${id}/${documento}`)
        ]);

        const listaLugares = await resLugares.json();
        const listaGruposPob = await resGrupos.json();
        const mand = await resMand.json();

        // 2. PETICIÓN CLAVE: Traer la relación de la tabla intermedia
        // Asumiendo que tu endpoint para la intermedia filtra por el documento del mandatario
        const resIntermedia = await fetch(import.meta.env.VITE_PATH + `/poblacionesporpersona/${documento}`);
        const dataIntermedia = await resIntermedia.json();

        // 3. Extraer solo los IDs de los grupos
        // Ajusta 'IDGrupoPoblacional' al nombre exacto que devuelva tu tabla intermedia
        const idsSeleccionados = dataIntermedia.map(item => item.IDGrupoPoblacional);

        // 4. Lógica de lugar (Municipio/Departamento)
        const municipioInfo = listaLugares.find(l => l.IDLugar === mand.expedido);
        const deptoId = municipioInfo ? municipioInfo.IDOtroLugar : "";

        // 5. Actualizar estados
        setLugares(listaLugares);
        setListaGrupos(listaGruposPob);

        setFormData({
          ...mand,
          fNacimiento: mand.fNacimiento?.split("T")[0] || "",
          fInicioPeriodo: mand.fInicioPeriodo?.split("T")[0] || "",
          fFinPeriodo: mand.fFinPeriodo?.split("T")[0] || "",
          departamento: deptoId,
          residencia: mand.residencia || "",
          gruposPoblacionales: idsSeleccionados
        });

      } catch (err) {
        console.error("Error en carga de datos:", err);
      }
    };

    loadData();
  }, [documento, id]);

  // HANDLE CHANGE
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    let newValue = value;

    if (name === "documento") {
      newValue = newValue.replace(/\D/g, "");
      if (newValue.length > 10) return;
    }

    if (name === "telefono") {
      newValue = newValue.replace(/\D/g, "");
      if (newValue.length > 10) return;
    }

    if (["primernombre", "segundonombre", "primerapellido", "segundoapellido"].includes(name)) {
      newValue = newValue.replace(/[^A-Za-zÁÉÍÓÚáéíóúñÑ\s]/g, "");
    }

    if (type === "text" && name !== "email") {
      newValue = newValue.toUpperCase();
    }

    if (name === "cargo") {
      setFormData(prev => ({ ...prev, cargo: newValue, comision: "" }));
      return;
    }

    if (name === "comision") {
      setFormData(prev => ({ ...prev, comision: newValue, cargo: "" }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleCheckboxChange = (id) => {
    setFormData((prev) => {
      const seleccionados = prev.gruposPoblacionales;
      const esNuevo = !seleccionados.includes(id);

      return {
        ...prev,
        gruposPoblacionales: esNuevo
          ? [...seleccionados, id]          // Si no está, lo agregamos
          : seleccionados.filter(g => g !== id) // Si está, lo quitamos
      };
    });
  };

  // ENVIAR FORMULARIO
  const handleSubmit = async () => {
    // Validaciones (mismas que en crear)
    if (!/^\d{6,10}$/.test(formData.documento)) {
      AlertMessage.success("El documento debe tener entre 6 y 10 números");
      return;
    }

    if (!/^\d{10}$/.test(formData.telefono)) {
      AlertMessage.success("El teléfono debe tener exactamente 10 dígitos");
      return;
    }

    if (formData.email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.email)) {
      AlertMessage.success("El correo debe tener un dominio válido, como usuario@correo.com");
      return;
    }


    const camposNombre = ["primernombre", "primerapellido"];
    for (let campo of camposNombre) {
      if (!/^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(formData[campo])) {
        AlertMessage.success(`El campo "${campo.toUpperCase()}" solo debe contener letras`);
        return;
      }
    }

    try {
      const payload = { ...formData, email: formData.email || null };

      const res = await fetch(import.meta.env.VITE_PATH + `/mandatario/crear/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        AlertMessage.error("Error: " + data.message);
        return;
      }

      AlertMessage.info("Mandatario actualizado correctamente");
      navigate(`/juntas/detalle-junta/${id}`);

    } catch (error) {
      console.error(error);
      AlertMessage.error("Error de conexión al servidor");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <UserCog className="text-[#009E76]" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">Editar Mandatario</h1>
          </div>
          <p className="text-gray-500">Modifique la información del mandatario</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">

            {/* DATOS PERSONALES */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Input label="Documento" name="documento" value={formData.documento} onChange={handleChange} />
                <Select
                  label="Tipo Documento"
                  name="tipoDocumento"
                  value={formData.tipoDocumento}
                  onChange={handleChange}
                  options={tiposDocumento.map(t => ({ value: t.IDTipoDocumento, label: t.NombreTipo }))}
                />

                {/* 1. Selector de Departamentos */}
                <Select
                  label="Departamento"
                  name="departamento"
                  value={formData.departamento}
                  onChange={(e) => {
                    // Al cambiar de departamento, reseteamos el municipio (expedido)
                    setFormData({
                      ...formData,
                      departamento: e.target.value,
                      expedido: ""
                    });
                  }}
                  options={departamentos.map(d => ({
                    value: d.IDLugar,
                    label: d.NombreLugar
                  }))}
                />

                {/* 2. Selector de Municipios (Expedido en) */}
                <Select
                  label="Expedido en (Municipio)"
                  name="expedido"
                  value={formData.expedido}
                  onChange={handleChange} // Tu función estándar
                  disabled={!formData.departamento} // Deshabilitar si no hay departamento
                  options={municipiosFiltrados.map(m => ({
                    value: m.IDLugar,
                    label: m.NombreLugar
                  }))}
                />

                <Input label="Primer nombre" name="primernombre" value={formData.primernombre} onChange={handleChange} />
                <Input label="Segundo nombre" name="segundonombre" value={formData.segundonombre} onChange={handleChange} />
                <Input label="Primer apellido" name="primerapellido" value={formData.primerapellido} onChange={handleChange} />
                <Input label="Segundo apellido" name="segundoapellido" value={formData.segundoapellido} onChange={handleChange} />
                <Select
                  label="Género"
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  options={["Masculino", "Femenino", "Otro"]}
                />
                <Input type="date" label="F Nacimiento" name="fNacimiento" value={formData.fNacimiento} onChange={handleChange} />
                <Input label="Residencia" name="residencia" value={formData.residencia} onChange={handleChange} />
                <Input label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                <Input label="Profesión" name="profesion" value={formData.profesion} onChange={handleChange} />
                <Input type="email" label="Email" name="email" value={formData.email} onChange={handleChange} />
                {/* GRUPOS POBLACIONALES */}
                <div className="col-span-full mt-4">
                  <div className="flex gap-4">
                    <label className="text-sm font-semibold text-gray-700 w-32 text-right pt-2">
                      Grupos Poblacionales:
                    </label>
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {listaGrupos.map((grupo) => {
                        const grupoId = grupo.IDGrupoPoblacional || grupo.id;
                        const estaSeleccionado = formData.gruposPoblacionales.includes(grupoId);

                        console.log("🔍 Checkbox:", grupo.NombreGrupo, "ID:", grupoId, "Tipo:", typeof grupoId, "Seleccionado:", estaSeleccionado);

                        return (
                          <label key={grupoId} className="flex items-center gap-2 cursor-pointer hover:text-[#009E76] transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-[#009E76] focus:ring-[#009E76]"
                              checked={estaSeleccionado}
                              onChange={() => handleCheckboxChange(grupoId)}
                            />
                            <span className="text-sm text-gray-600">{grupo.NombreGrupo || grupo.nombre}</span>
                          </label>
                        );
                      })}

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DATOS JUNTA */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b-2 border-[#64AF59]">Datos Junta</h3>

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
                <Input
                  type="date"
                  label="Inicio de periodo"
                  name="fInicioPeriodo"
                  value={formData.fInicioPeriodo}
                  onChange={handleChange}
                />

                <Input
                  type="date"
                  label="Fin de periodo"
                  name="fFinPeriodo"
                  value={formData.fFinPeriodo}
                  onChange={handleChange}
                />

                {modo === "cargo" ? (
                  <Select
                    label="Cargo"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleChange}
                    options={cargos.map(c => ({ value: c.IDCargo, label: c.NombreCargo }))}
                    disabled={modo === "comision"}
                  />
                ) : (
                  <Select
                    label="Comisión"
                    name="comision"
                    value={formData.comision}
                    onChange={handleChange}
                    options={comisiones.map(c => ({ value: c.IDComision, label: c.Nombre }))}
                    disabled={modo === "cargo"}
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
                  Actualizar registro
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
function Input({ label, name, value, onChange, type = "text", disabled = false }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-semibold text-gray-700 w-32 text-right">{label}:</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`flex-1 border border-gray-300 rounded px-3 py-1.5 outline-none
          ${disabled ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-[#009E76]"}
        `}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options, disabled }) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-semibold text-gray-700 w-32 text-right">{label}:</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white 
          ${disabled ? "bg-gray-200 cursor-not-allowed" : "focus:ring-2 focus:ring-[#009E76]"}
        `}
      >
        <option value="">Seleccione...</option>
        {options.map((op, index) => {
          const val = typeof op === "string" ? op : op.value;
          const lab = typeof op === "string" ? op : op.label;
          return <option key={index} value={val}>{lab}</option>;
        })}
      </select>
    </div>
  );
}