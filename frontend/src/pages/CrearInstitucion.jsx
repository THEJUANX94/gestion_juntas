import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function CrearInstitucion() {
	const navigate = useNavigate();
	const [nombre, setNombre] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!nombre.trim()) return AlertMessage.error("Error", "El nombre es requerido");
		setLoading(true);
		try {
			const res = await fetch(import.meta.env.VITE_PATH + "/instituciones/crearinstitucion", {
				method: "POST",
				credentials: 'include',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ NombreInstitucion: nombre.trim() })
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Error al crear institución");

			AlertMessage.success("Creado", "Institución creada correctamente");
			navigate("/instituciones/listar");
		} catch (err) {
			console.error(err);
			AlertMessage.error("Error", err.message || "No se pudo crear la institución");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full">
			<h1 className="text-2xl mb-6" style={{ color: "var(--color-text-color-page)" }}>Crear Institución</h1>

			<form onSubmit={handleSubmit} className="max-w-md">
				<label className="block mb-2 text-sm font-medium">Nombre de la Institución</label>
				<input
					value={nombre}
					onChange={(e) => setNombre(e.target.value)}
					className="w-full border rounded px-3 py-2 mb-4"
					placeholder="Ej. Institución Municipal"
				/>

				<div className="flex gap-2">
					<button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
						{loading ? "Creando..." : "Crear"}
					</button>
					<button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate('/instituciones/listar')}>Cancelar</button>
				</div>
			</form>

			<Footer />
		</div>
	);
}

