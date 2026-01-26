const API_URL = import.meta.env.VITE_PATH + '/juntas'; 

export const crearNuevoPeriodoJunta = async (id, datos) => {
  const response = await fetch(`${API_URL}/${id}/cambiar-periodo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Si usas autenticación, aquí iría el token:
      // 'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(datos) // Convertimos el objeto a texto para el servidor
  });

  // Obtenemos el cuerpo de la respuesta
  const data = await response.json();

  // Fetch NO lanza error automáticamente en códigos 400 o 500
  // Tenemos que lanzarlo nosotros si ok es false
  if (!response.ok) {
    throw new Error(data.message || 'Error al procesar la solicitud');
  }

  return data;
};