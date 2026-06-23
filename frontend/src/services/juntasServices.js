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

// Obtiene todos los periodos (histórico) del mismo linaje de junta
export const obtenerPeriodosJunta = async (id) => {
  const response = await fetch(`${API_URL}/${id}/periodos`, {
    credentials: 'include',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al obtener los periodos');
  }

  return data;
};

// Reactiva un periodo (junta) y desactiva los demás del mismo linaje
export const reactivarJunta = async (id) => {
  const response = await fetch(`${API_URL}/${id}/reactivar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Error al reactivar el periodo');
  }

  return data;
};