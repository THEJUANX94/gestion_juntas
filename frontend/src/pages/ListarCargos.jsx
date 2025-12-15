import { useState, useEffect } from "react";
import { Search, Edit, Trash2, User, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/ui/Footer";
import { AlertMessage } from "../components/ui/AlertMessage";

export default function ListarCargos() {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const [cargos, setCargos] = useState([]);
	const [showFilter, setShowFilter] = useState({ nombre: false });
	const [filtros, setFiltros] = useState({ nombre: "" });

	useEffect(() => {
		const fetchCargos = async () => {
			try {
				const res = await fetch(import.meta.env.VITE_PATH + "/cargos", { credentials: 'include', method: "GET" });
				const data = await res.json();
				const transformados = data.map((c) => ({
					IDCargo: c.IDCargo,
					nombre: c.NombreCargo,
				}));
				setCargos(transformados);
			} catch (error) {
				console.error("Error al cargar cargos:", error);
			}
		};

		fetchCargos();
	}, []);

	const generalFiltered = cargos.filter((u) => {
		const texto = search.toLowerCase();
		return Object.values(u).some((valor) => String(valor).toLowerCase().includes(texto));
	});

	const filtered = generalFiltered.filter((u) =>
		Object.keys(filtros).every((key) => (filtros[key] ? String(u[key]).toLowerCase().includes(filtros[key].toLowerCase()) : true))
	);

	// Pagination
	const [page, setPage] = useState(1);
	const perPage = 10;
	const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [totalPages]);

	const paginated = filtered.slice((page - 1) * perPage, page * perPage);

	const toggleFilter = (col) => setShowFilter((prev) => ({ ...prev, [col]: !prev[col] }));
	const handleFiltro = (col, value) => setFiltros((prev) => ({ ...prev, [col]: value }));

	const handleEdit = (item) => navigate(`/cargos/update/${item.IDCargo}`);

	const handleDelete = async (item) => {
		const confirmed = await AlertMessage.confirm("Eliminar cargo", `¿Eliminar el cargo ${item.nombre}?`);
		if (!confirmed) return;
		try {
			const res = await fetch(import.meta.env.VITE_PATH + `/cargos/${item.IDCargo}`, { method: "DELETE", credentials: 'include' });
			if (!res.ok) throw new Error("Error al eliminar cargo");
			setCargos((prev) => prev.filter((c) => c.IDCargo !== item.IDCargo));
			AlertMessage.success("Eliminado", "El cargo fue eliminado correctamente.");
		} catch (err) {
			console.error(err);
			AlertMessage.error("Error", "No se pudo eliminar el cargo.");
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl" style={{ color: "var(--color-text-color-page)" }}>Listar Cargos</h1>
				<div className="flex gap-2">
					<button
						className="px-4 py-2 rounded bg-green-600 text-white"
						onClick={() => navigate('/cargos/create')}
					>
						Crear Cargo
					</button>
				</div>
			</div>

			<div className="flex justify-end mb-4">
				<div className="relative">
					<Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
					<input
						type="text"
						placeholder="Buscar en todos los campos..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-8 pr-3 py-2 border rounded-md text-sm w-64"
						style={{ backgroundColor: "var(--color-background-table)", color: "var(--color-text-color-table)" }}
					/>
				</div>
			</div>

			<div className="flex-1 overflow-x-auto">
				<table className="min-w-full border rounded-md shadow-sm text-sm" style={{ backgroundColor: "var(--color-background-table)" }}>
					<thead className="text-left font-semibold" style={{ backgroundColor: "var(--color-background-upper)", color: "var(--color-text-color-upper)" }}>
						<tr>
							<th className="px-4 py-2">
								<div className="flex items-center justify-between">
									Nombre Cargo 2
									<button onClick={() => toggleFilter('nombre')}><Filter className="h-4 w-4 text-gray-500" /></button>
								</div>
								{showFilter.nombre && (
									<input type="text" value={filtros.nombre} onChange={(e) => handleFiltro('nombre', e.target.value)} placeholder="Filtrar por nombre" className="mt-1 w-full border rounded px-2 py-1 text-sm" />
								)}
							</th>
							<th className="px-4 py-2"></th>
						</tr>
					</thead>
					<tbody>
						{paginated.length > 0 ? (
							paginated.map((u, i) => (
								<tr key={i} className="border-b transition" style={{ color: "var(--color-text-color-table)" }}>
									<td className="px-4 py-3 flex items-center gap-2">
										<div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
											<User className="h-5 w-5 text-gray-500" />
										</div>
										{u.nombre}
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2 whitespace-nowrap">
											<button className="p-2 rounded hover:bg-gray-100" onClick={() => handleEdit(u)} title="Editar cargo"><Edit className="h-4 w-4 text-blue-600" /></button>
											<button className="p-2 rounded hover:bg-gray-100" onClick={() => handleDelete(u)} title="Eliminar cargo"><Trash2 className="h-4 w-4 text-red-600" /></button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={2} className="text-center py-6 text-gray-500 italic">🚫 No se encontraron registros</td>
							</tr>
						)}
					</tbody>
				</table>

				{/* Pagination controls */}
				<div className="flex items-center justify-between mt-4">
					<p className="text-sm text-gray-600">Mostrando {Math.min((page - 1) * perPage + 1, filtered.length)} - {Math.min(page * perPage, filtered.length)} de {filtered.length}</p>
					<div className="flex items-center gap-2">
						<button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Anterior</button>
						{Array.from({ length: totalPages }).map((_, idx) => (
							<button key={idx} className={`px-3 py-1 rounded ${page === idx + 1 ? 'bg-green-600 text-white' : 'border'}`} onClick={() => setPage(idx + 1)}>{idx + 1}</button>
						))}
						<button className="px-3 py-1 border rounded" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente</button>
					</div>
				</div>
			</div>

			<Footer />
		</div>
	);
}