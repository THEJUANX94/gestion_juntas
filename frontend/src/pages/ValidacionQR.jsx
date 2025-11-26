import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../components/ui/Footer";

export default function ValidacionQR() {
	const { IDCertificado } = useParams(); // id debe estar en la ruta
	const [result, setResult] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchCertificado = async () => {
			setLoading(true);
			setError("");
			try {
				const res = await fetch(import.meta.env.VITE_PATH + `/certificados/validar/${IDCertificado}`);
				const data = await res.json();
				setResult(data);
			} catch (err) {
				setError("No se pudo validar el certificado.");
			}
			setLoading(false);
		};
		fetchCertificado();
	}, [IDCertificado]);

	return (
		<div className="flex flex-col h-full items-center justify-center" style={{ minHeight: "100vh" }}>
			<h1 className="text-2xl mb-6 font-bold" style={{ color: "var(--color-text-color-page)" }}>
				Validación de Certificado QR
			</h1>
			<div className="bg-white rounded-lg shadow p-6 w-full max-w-md mb-8">
				{loading && <div className="text-gray-500">Cargando...</div>}
				{error && <div className="mt-4 text-red-500">{error}</div>}
				{result && (
					<div className="mt-6">
						{result.valido ? (
							<div className="bg-green-100 border border-green-400 rounded p-4">
								<h2 className="text-lg font-semibold text-green-700 mb-2">Certificado válido ✅</h2>
								<div className="text-sm text-gray-700">
									<div><span className="font-bold">Fecha de Creación:</span> {new Date(result.data.FechaCreacion).toLocaleString()}</div>
									<div><span className="font-bold">Tipo Junta:</span> {result.data.TipoCertificado}</div>
									<div><span className="font-bold">Certificado:</span> {result.data.IDCertificado}</div>
								</div>
							</div>
						) : (
							<div className="bg-red-100 border border-red-400 rounded p-4">
								<h2 className="text-lg font-semibold text-red-700 mb-2">Certificado inválido ❌</h2>
								<div className="text-sm text-gray-700">{result.mensaje}</div>
							</div>
						)}
					</div>
				)}
			</div>
			<Footer />
		</div>
	);
}
