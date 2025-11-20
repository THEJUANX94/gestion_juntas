import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../components/ui/FormField";
import FormSelect from "../components/ui/FormSelect";
import ActionButton from "../components/ui/ActionButton";
import Footer from "../components/ui/Footer";
import { Card, CardContent } from "../components/ui/card";
import { AlertMessage } from "../components/ui/AlertMessage";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function UserForm({ initialData = null, mode = "create", onSubmit }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    NumeroIdentificacion: "",
    PrimerApellido: "",
    SegundoApellido: "",
    PrimerNombre: "",
    SegundoNombre: "",
    Sexo: "",
    TipoSangre: "",
    FechaNacimiento: "",
    NombreRol: "",
    Correo: "",
    Celular: "",
    Firma: null,
    Usuario: null,
    Contrasena: null,
  });

  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState(null);
  const [formDisabled, setFormDisabled] = useState(false);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm(prev => ({
        ...prev,
        NumeroIdentificacion: initialData.NumeroIdentificacion || "",
        PrimerApellido: initialData.PrimerApellido || "",
        SegundoApellido: initialData.SegundoApellido || "",
        PrimerNombre: initialData.PrimerNombre || "",
        SegundoNombre: initialData.SegundoNombre || "",
        Sexo: initialData.Sexo || initialData.sexo || "",              
        TipoSangre: initialData.tipodesangre || "",    
        FechaNacimiento: initialData.FechaNacimiento || "",
        NombreRol: initialData.nombrerol || "",      
        Correo: initialData.Correo || "",
        Celular: initialData.Celular || "",
        Firma: initialData.Firma || null,
        Usuario: initialData.Usuario || null,
        Contrasena: initialData.Contrasena || null,
      }));

      if (initialData.Firma) {
        setPreview(initialData.Firma);
      }
    }
  }, [initialData]);

  const regex = {
    NumeroIdentificacion: /^[0-9]{7,10}$/,
    Correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    Celular: /^[0-9]{10}$/,
    texto: /^[a-zA-ZÀ-ÿ\s]{1,40}$/,
  };

  const sanitizeInput = (value) => value.replace(/[<>]/g, "").trim();

  const normalizeText = (value) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
  };

  const handleCancel = () => {
  if (mode === "create") {
    setForm({
      NumeroIdentificacion: "",
      PrimerApellido: "",
      SegundoApellido: "",
      PrimerNombre: "",
      SegundoNombre: "",
      Sexo: "",
      TipoSangre: "",
      FechaNacimiento: "",
      NombreRol: "",
      Correo: "",
      Celular: "",
      Firma: null,
      Usuario: null,
      Contrasena: null,
    });
    setPreview(null);
    setErrors({});
    setExists(null);
    setFormDisabled(false);
    setEmailError("");
  } 
  else if (mode === "edit" && initialData) {
    setForm(initialData);
    if (initialData.Firma) {
      setPreview(initialData.Firma);
    } else {
      setPreview(null);
    }
    setErrors({});
    setExists(null);
    setFormDisabled(false);
    setEmailError("");
    navigate("/usuarios/listar");
  }
};


  const handleChange = async (field, value) => {
    let sanitized = sanitizeInput(value);

    if (["PrimerApellido", "SegundoApellido", "PrimerNombre", "SegundoNombre"].includes(field)) {
      sanitized = normalizeText(sanitized);
    }
    
    setForm({ ...form, [field]: sanitized });
    validateField(field, sanitized);

    if (field === "NumeroIdentificacion" && sanitized.length >= 7 && mode === "create") {
      setChecking(true);
      setExists(null);

      try {
        const res = await fetch(import.meta.env.VITE_PATH + `/usuarios/verificar/${sanitized}`, {
          credentials: 'include',
          method: "GET"
        });
        const data = await res.json();

        if (data.existe) {
          setExists(true);
          setFormDisabled(true);
          AlertMessage.error("Identificación duplicada", "Ya existe un usuario con esta identificación.");
        } else {
          setExists(false);
          setFormDisabled(false);
        }
      } catch (err) {
        console.error("Error al verificar identificación:", err);
        setExists(null);
      } finally {
        setChecking(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg"];
    if (!allowedTypes.includes(file.type)) {
      setErrors({ ...errors, Firma: "Solo se permiten imágenes PNG o JPG" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, Firma: "Máx 2MB" });
      return;
    }

    setForm({ ...form, Firma: file });
    setPreview(URL.createObjectURL(file));
    setErrors({ ...errors, Firma: "" });
  };

  const validateField = (field, value) => {
    let message = "";
    switch (field) {
      case "NumeroIdentificacion":
        if (!regex.NumeroIdentificacion.test(value))
          message = "Debe contener 7 a 10 dígitos";
        break;
      case "Correo":
        if (!regex.Correo.test(value)) message = "Correo inválido";
        break;
      case "Celular":
        if (!regex.Celular.test(value)) message = "Debe tener 10 dígitos";
        break;
      case "PrimerApellido":
      case "SegundoApellido":
      case "PrimerNombre":
      case "SegundoNombre":
        if (value && !regex.texto.test(value))
          message = "Solo letras y espacios";
        break;
      case "FechaNacimiento":
        if (value) {
          const nacimiento = new Date(value);
          const hoy = new Date();
          let edad = hoy.getFullYear() - nacimiento.getFullYear();
          const mes = hoy.getMonth() - nacimiento.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate()))
            edad--;
          if (edad < 18) message = "Debe ser mayor de 18 años";
        }
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const isFormValid = () => {
    const hasErrors = Object.values(errors).some((err) => err && err.length > 0);
    const requiredFields = [
      "NumeroIdentificacion",
      "PrimerApellido",
      "PrimerNombre",
      "FechaNacimiento",
      "Correo",
      "Celular",
      "NombreRol"
    ];
    const hasEmpty = requiredFields.some((f) => !form[f]);
    
    if (form.NombreRol === "Mandatario" && !form.Firma) {
      return false;
    }

    if (form.NombreRol === "Administrador" && (!form.Usuario || !form.Contrasena)) {
      return false;
    }

    if (mode === "create" && exists !== false) {
      return false;
    }
    
    return !hasErrors && !hasEmpty;
  };

  const verificarCorreoExistente = async (correo) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_PATH}/usuarios/verificar-correo/${correo}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Error al verificar correo');
      const data = await response.json();
      return data.existe;
    } catch (error) {
      console.error('Error al verificar correo:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    console.log('Submitting form...', { form, isValid: isFormValid() });

    if (!isFormValid()) {
      AlertMessage.error("Error de Validación", "Por favor, complete todos los campos requeridos.");
      return;
    }

    try {
      if (mode === "create" || (initialData && form.Correo !== initialData.Correo)) {
        const correoExiste = await verificarCorreoExistente(form.Correo);
        if (correoExiste) {
          setEmailError("Este correo ya está registrado");
          AlertMessage.error("Error", "Este correo ya está registrado");
          return;
        }
      }

      const formData = new FormData();
      
      Object.keys(form).forEach(key => {
        if (key === 'Firma') {
          if (form[key] instanceof File) {
            formData.append('Firma', form[key]);
          }
        } else if (form[key] !== null && form[key] !== '') {
          formData.append(key, form[key]);
        }
      });

      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ':', pair[1]);
      }

      await onSubmit(formData);

      if (form.NombreRol === "Administrador") {
        const credencialesData = {
          Usuario: form.Usuario,
          Contrasena: form.Contrasena,
          Correo: form.Correo,
        };

        await fetch(import.meta.env.VITE_PATH + "/credenciales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credencialesData),
          credentials: "include"
        });
      }

      AlertMessage.success(
        mode === "create" ? "Registro exitoso" : "Actualización exitosa",
        mode === "create"
          ? "El usuario fue registrado correctamente."
          : "La información fue actualizada correctamente."
      );

      if (mode === "create") {
        handleCancel();
      }

    } catch (err) {
      console.error('Error completo:', err);
      AlertMessage.error("Error", err.message || "Hubo un problema al guardar la información.");
    }
  };

  const handleRoleChange = (v) => {
    setForm(prev => ({
      ...prev,
      NombreRol: v,
      Firma: v === "Mandatario" ? prev.Firma : null
    }));
    
    if (v !== "Mandatario") {
      setPreview(null);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 py-8">
      <Card className="w-full max-w-[500px] mx-4">
        <CardContent className="space-y-4 p-6">
          <h2 className="text-2xl font-bold text-center mb-4">
            {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FormField
                label="Número Identificación"
                value={form.NumeroIdentificacion}
                onChange={(e) => handleChange("NumeroIdentificacion", e.target.value)}
                placeholder="Ingrese número"
                error={errors.NumeroIdentificacion}
                disabled={formDisabled}
              />

              <div className="absolute right-3 top-8">
                {checking && <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />}
                {!checking && exists === true && (
                  <XCircle className="h-5 w-5 text-red-500" title="Ya registrada" />
                )}
                {!checking && exists === false && (
                  <CheckCircle className="h-5 w-5 text-green-500" title="Disponible" />
                )}
              </div>

              {checking && <p className="text-xs text-gray-500 mt-1">Verificando...</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Primer Apellido"
                value={form.PrimerApellido}
                onChange={(e) => handleChange("PrimerApellido", e.target.value)}
                disabled={formDisabled}
                error={errors.PrimerApellido}
              />
              <FormField
                label="Segundo Apellido"
                value={form.SegundoApellido}
                onChange={(e) => handleChange("SegundoApellido", e.target.value)}
                disabled={formDisabled}
                error={errors.SegundoApellido}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Primer Nombre"
                value={form.PrimerNombre}
                onChange={(e) => handleChange("PrimerNombre", e.target.value)}
                disabled={formDisabled}
                error={errors.PrimerNombre}
              />
              <FormField
                label="Segundo Nombre"
                value={form.SegundoNombre}
                onChange={(e) => handleChange("SegundoNombre", e.target.value)}
                disabled={formDisabled}
                error={errors.SegundoNombre}
              />
            </div>

            <FormSelect
              label="Sexo"
              value={form.Sexo}
              onChange={(v) => handleChange("Sexo", v)}
              disabled={formDisabled}
              options={[
                { value: "masculino", label: "Masculino" },
                { value: "femenino", label: "Femenino" },
                { value: "noBinario", label: "No Binario" },
                { value: "otro", label: "Otro" },
              ]}
            />

            <FormField
              label="Fecha Nacimiento"
              type="date"
              value={form.FechaNacimiento}
              onChange={(e) => handleChange("FechaNacimiento", e.target.value)}
              disabled={formDisabled}
              error={errors.FechaNacimiento}
            />

            <FormSelect
              label="Tipo de Sangre"
              value={form.TipoSangre}
              onChange={(v) => handleChange("TipoSangre", v)}
              disabled={formDisabled}
              options={[
                { value: "O+", label: "O+" },
                { value: "O-", label: "O-" },
                { value: "A+", label: "A+" },
                { value: "A-", label: "A-" },
                { value: "B+", label: "B+" },
                { value: "B-", label: "B-" },
                { value: "AB+", label: "AB+" },
                { value: "AB-", label: "AB-" },
              ]}
            />

            <FormSelect
              label="Rol"
              value={form.NombreRol}
              onChange={handleRoleChange}
              disabled={formDisabled}
              options={[
                { value: "Administrador", label: "Administrador" },
                { value: "AUxiliar", label: "Auxiliar" },
                { value: "Mandatario", label: "Mandatario" }
              ]}
            />

            {form.NombreRol === "Mandatario" && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  Firma (PNG/JPG, máx 2MB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  className="border rounded p-2 w-full"
                  disabled={formDisabled}
                />
                {errors.Firma && (
                  <p className="text-red-500 text-xs mt-1">{errors.Firma}</p>
                )}
                {!form.Firma && (
                  <p className="text-amber-600 text-xs mt-1">La firma es obligatoria para Mandatarios</p>
                )}
                {preview && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-1">Vista previa:</p>
                    <img
                      src={preview}
                      alt="Vista previa firma"
                      className="w-32 h-20 border rounded object-contain bg-gray-50"
                    />
                  </div>
                )}
              </div>
            )}
            {form.NombreRol === "Administrador" && (
              <div>
                <label className="text-sm font-medium block mb-1">
                  Usuario <span className="text-red-500">*</span>
                </label>
                  <input
                    type="text"
                    value={form.Usuario}
                    onChange={(e) => handleChange("Usuario", e.target.value)}
                    className="border rounded p-2 w-full"
                    placeholder="Ingrese el nombre de usuario"
                  />

                  <input
                    type="password"
                    value={form.Contrasena}
                    onChange={(e) => handleChange("Contrasena", e.target.value)}
                    className="border rounded p-2 w-full"
                    placeholder="Ingrese la contraseña"
                  />

                {errors.Contrasena && (
                  <p className="text-red-500 text-xs mt-1">{errors.Contrasena}</p>
                )}
              </div>
            )}

            <FormField
              label="Correo Electrónico"
              type="email"
              value={form.Correo}
              onChange={(e) => handleChange("Correo", e.target.value)}
              placeholder="usuario@ejemplo.com"
              disabled={formDisabled}
              error={errors.Correo}
            />

            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}

            <FormField
              label="Celular"
              value={form.Celular}
              onChange={(e) => handleChange("Celular", e.target.value)}
              placeholder="Ingrese celular"
              disabled={formDisabled}
              error={errors.Celular}
            />

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCancel();
                }}
                className="border rounded px-4 py-2 flex-1"
              >
                Cancelar
              </button>
              <ActionButton 
                type="submit" 
                disabled={!isFormValid() || formDisabled}
                className="flex-1"
              >
                {mode === "create" ? "Crear Usuario" : "Actualizar Usuario"}
              </ActionButton>
            </div>
          </form>
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
}