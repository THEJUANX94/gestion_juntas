import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import Footer from "../components/ui/Footer";

export default function EditarOrganismo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(import.meta.env.VITE_PATH + `/tipojunta/${id}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        setNombre(data.NombreTipoJunta || "");
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        AlertMessage.error("Error", "No se pudo cargar el organismo");
        navigate("/organismos/listar");
      });
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return AlertMessage.error("Error", "El nombre es requerido");

    try {
      const res = await fetch(import.meta.env.VITE_PATH + `/tipojunta/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ NombreTipoJunta: nombre.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar organismo");

      AlertMessage.success("Actualizado", "Organismo actualizado correctamente");
      navigate("/organismos/listar");
    } catch (err) {
      console.error(err);
      AlertMessage.error("Error", err.message || "No se pudo actualizar el organismo");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <p>Cargando...</p>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl mb-6" style={{ color: "var(--color-text-color-page)" }}>Editar Organismo</h1>

      <form onSubmit={handleSubmit} className="max-w-md">
        <label className="block mb-2 text-sm font-medium">Nombre del Organismo</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Ej. Junta Municipal"
          required
        />

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">
            Guardar cambios
          </button>
          <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate('/organismos/listar')}>Cancelar</button>
        </div>
      </form>

      <Footer />
    </div>
  );
}
