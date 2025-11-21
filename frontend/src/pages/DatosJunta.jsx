import { useState } from "react";
import { Save, Calendar, FileText, Users } from "lucide-react";

export default function DatosJunta() {
  const [formData, setFormData] = useState({
    periodo: "2022-2026",
    fechaAsamblea: "2016-04-24",
    fechaInicioPeriodo: "2016-07-01",
    fechaFinPeriodo: "2020-06-30",
    numeroAfiliados: ""
  });

  const [juntaInfo] = useState({
    nombre: "JUNTA DE ACCIÓN COMUNAL CENTRAL",
    municipio: "AQUITANIA",
    departamento: "Boyacá",
    personeriaJuridica: "689",
    fechaPersoneria: "16-09-1963",
    expedidaPor: "Pendiente",
    fechaAsamblea: "00-01-1900",
    periodoEleccion: "01-07-2012 y el 30-06-2016"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInsertarRegistro = () => {
    console.log("Insertar registro:", formData);
    alert("Registro insertado correctamente");
  };

  const handleActualizarRegistro = () => {
    console.log("Actualizar registro:", formData);
    alert("Registro actualizado correctamente");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-[#009E76]" size={28} />
            <h1 className="text-3xl font-bold text-gray-800">Datos de la Junta</h1>
          </div>
          <p className="text-gray-500">Gestión de periodos y información general</p>
        </div>

        {/* Formulario de Periodo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-[#009E76]" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Información del Periodo</h2>
          </div>

          <div className="space-y-6">
            {/* Periodo */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-right font-medium text-gray-700">
                Periodo:
              </label>
              <select
                name="periodo"
                value={formData.periodo}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none max-w-xs"
              >
                <option value="2022-2026">2022-2026</option>
                <option value="2018-2022">2018-2022</option>
                <option value="2014-2018">2014-2018</option>
                <option value="2010-2014">2010-2014</option>
              </select>
            </div>

            {/* Fecha Asamblea */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-right font-medium text-gray-700">
                Fecha Asamblea:
              </label>
              <input
                type="date"
                name="fechaAsamblea"
                value={formData.fechaAsamblea}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none max-w-xs"
              />
            </div>

            {/* Fecha Inicio Periodo */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-right font-medium text-gray-700">
                Fecha Inicio Periodo:
              </label>
              <input
                type="date"
                name="fechaInicioPeriodo"
                value={formData.fechaInicioPeriodo}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none max-w-xs"
              />
            </div>

            {/* Fecha Fin Periodo */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-right font-medium text-gray-700">
                Fecha Fin Periodo:
              </label>
              <input
                type="date"
                name="fechaFinPeriodo"
                value={formData.fechaFinPeriodo}
                onChange={handleChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#009E76] focus:border-transparent outline-none max-w-xs"
              />
            </div>

            {/* Botón Insertar */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <div></div>
              <button
                onClick={handleInsertarRegistro}
                className="flex items-center justify-center gap-2 bg-[#009E76] hover:bg-[#007d5e] text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors max-w-xs"
              >
                <Save size={18} />
                Insertar registro
              </button>
            </div>
          </div>
        </div>

        {/* Formulario de Afiliados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-[#64AF59]" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">Número de Afiliados</h2>
          </div>

          <div className="space-y-6">
            {/* Numero Afiliados */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <label className="text-right font-medium text-gray-700">
                Número Afiliados:
              </label>
              <input
                type="text"
                name="numeroAfiliados"
                value={formData.numeroAfiliados}
                onChange={handleChange}
                placeholder="Ingrese el número de afiliados"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#64AF59] focus:border-transparent outline-none max-w-md"
              />
            </div>

            {/* Botón Actualizar */}
            <div className="grid grid-cols-[200px_1fr] items-center gap-4">
              <div></div>
              <button
                onClick={handleActualizarRegistro}
                className="flex items-center justify-center gap-2 bg-[#64AF59] hover:bg-[#52934a] text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors max-w-xs"
              >
                <Save size={18} />
                Actualizar registro
              </button>
            </div>
          </div>
        </div>

        {/* Información de la Junta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="border-2 border-[#009E76] rounded-lg p-6 bg-gradient-to-br from-white to-gray-50">
            <p className="text-gray-800 leading-relaxed text-justify">
              <strong className="font-bold text-[#009E76]">{juntaInfo.nombre}</strong> del municipio de{" "}
              <strong className="font-bold">{juntaInfo.municipio}</strong>, Departamento de{" "}
              <strong className="font-bold">{juntaInfo.departamento}</strong>, con Personería Jurídica No.
              <strong className="font-bold">{juntaInfo.personeriaJuridica}</strong> de fecha{" "}
              {juntaInfo.fechaPersoneria}, expedida por {juntaInfo.expedidaPor}. Realizó Asamblea General el día{" "}
              {juntaInfo.fechaAsamblea} con el fin de elegir dignatarios para el período comprendido entre el{" "}
              {juntaInfo.periodoEleccion}.
            </p>
          </div>

          {/* Sección de Autoresolutorio y certificado */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Autoresolutorio y certificado</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#009E76] to-[#64AF59]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white border-r border-white/20">
                      Dato
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                      Fecha Ingreso
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-300 bg-white hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-300">-</td>
                    <td className="px-4 py-3 text-sm text-gray-600">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}