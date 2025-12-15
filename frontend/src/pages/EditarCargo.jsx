import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function EditarCargo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    fetch(import.meta.env.VITE_PATH + `/cargos/${id}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setNombre(data.NombreCargo));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(import.meta.env.VITE_PATH + `/cargos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ NombreCargo: nombre }),
    });

    if (res.ok) {
      AlertMessage.success("Actualizado", "Cargo actualizado correctamente");
      navigate("/cargos/listar");
    } else {
      AlertMessage.error("Error", "No se pudo actualizar el cargo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <h1 className="text-xl mb-4">Editar Cargo</h1>

      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="border p-2 w-full mb-4"
        placeholder="Nombre del cargo"
      />

      <button className="bg-green-600 text-white px-4 py-2 rounded">
        Guardar cambios
      </button>
    </form>
  );
}
