import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function UpdateComision() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComision = async () => {
      try {
        const res = await fetch(import.meta.env.VITE_PATH + `/comisiones/${id}`);
        if (!res.ok) throw new Error('No se pudo cargar la comisión');
        const data = await res.json();
        setNombre(data.Nombre || '');
      } catch (err) {
        console.error(err);
        AlertMessage.error('Error', 'No se pudo cargar la comisión');
      }
    };
    if (id) fetchComision();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return AlertMessage.error("Error", "El nombre es requerido");
    setLoading(true);
    try {
      const res = await fetch(import.meta.env.VITE_PATH + `/comisiones/${id}`, {
        method: "PUT",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Nombre: nombre.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar comisión");

      AlertMessage.success("Actualizado", "Comisión actualizada correctamente");
      navigate("/comisiones/listar");
    } catch (err) {
      console.error(err);
      AlertMessage.error("Error", err.message || "No se pudo actualizar la comisión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl mb-6" style={{ color: "var(--color-text-color-page)" }}>Editar Comisión</h1>

      <form onSubmit={handleSubmit} className="max-w-md">
        <label className="block mb-2 text-sm font-medium">Nombre de la Comisión</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4"
          placeholder="Ej. Comisión de Educación"
        />

        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate('/comisiones/listar')}>Cancelar</button>
        </div>
      </form>

      <Footer />
    </div>
  );
}
