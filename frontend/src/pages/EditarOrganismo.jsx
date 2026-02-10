import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertMessage } from "../components/ui/AlertMessage";
import Footer from "../components/ui/Footer";

export default function EditarOrganismo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    fetch(import.meta.env.VITE_PATH + `/tipojunta/${id}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => setNombre(data.NombreTipoJunta));
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(import.meta.env.VITE_PATH + `/tipojunta/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ Nombre: nombre }),
    });

    if (res.ok) {
      AlertMessage.success("Actualizado", "Organismo actualizado correctamente");
      navigate("/organismos/listar");
    } else {
      AlertMessage.error("Error", "No se pudo actualizar el organismo");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Editar Organismo
            </h1>
            <p className="text-gray-500">
              Actualiza la información del organismo
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="nombre" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre del organismo
              </label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 outline-none"
                placeholder="Ingrese el nombre del organismo"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold px-6 py-3 rounded-lg hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition duration-200 shadow-md hover:shadow-lg"
              >
                Guardar cambios
              </button>
              
              <button
                type="button"
                onClick={() => navigate("/organismos/listar")}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-300 transform hover:scale-105 transition duration-200"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}