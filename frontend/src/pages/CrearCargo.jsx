import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function CrearCargo() {
	const navigate = useNavigate();
	const [nombre, setNombre] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!nombre.trim()) return AlertMessage.error("Error", "El nombre es requerido");
		setLoading(true);
		try {
			const res = await fetch(import.meta.env.VITE_PATH + "/cargos", {
				method: "POST",
				credentials: 'include',
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ NombreCargo: nombre.trim() })
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.message || "Error al crear cargo");

			AlertMessage.success("Creado", "Cargo creado correctamente");
			navigate("/cargos/listar");
		} catch (err) {
			console.error(err);
			AlertMessage.error("Error", err.message || "No se pudo crear el cargo");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col h-full">
			<h1 className="text-2xl mb-6" style={{ color: "var(--color-text-color-page)" }}>Crear Cargo</h1>

			<form onSubmit={handleSubmit} className="max-w-md">
				<label className="block mb-2 text-sm font-medium">Nombre del Cargo</label>
				<input
					value={nombre}
					onChange={(e) => setNombre(e.target.value)}
					className="w-full border rounded px-3 py-2 mb-4"
					placeholder="Ej. Secretario"
				/>

				<div className="flex gap-2">
					<button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={loading}>
						{loading ? "Creando..." : "Crear"}
					</button>
					<button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={() => navigate('/cargos/listar')}>Cancelar</button>
				</div>
			</form>

			<Footer />
		</div>
	);
}

