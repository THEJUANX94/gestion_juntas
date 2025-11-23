import { useNavigate } from "react-router-dom";
import UserForm from "./UserForm";

export default function CreateUser() {
  const navigate = useNavigate();

  const handleCreate = async (form) => {
    try {
      console.log('Form data being sent:', form);
      const isFormData = typeof FormData !== 'undefined' && form instanceof FormData;

      const fetchOptions = {
        method: "POST",
        credentials: 'include',
        body: isFormData
          ? form
          : JSON.stringify({ ...(form || {}), NombreRol: form?.NombreRol })
      };

      if (!isFormData) {
        fetchOptions.headers = { "Content-Type": "application/json" };
      }

      const response = await fetch(import.meta.env.VITE_PATH + "/usuarios", fetchOptions);

      // read text then parse (defensive)
      const text = await response.text();
      let data = null;
      try { data = JSON.parse(text); } catch (e) { /* not json */ }

      if (!response.ok) {
        console.error('Server error details:', data || text);
        throw new Error((data && data.message) || text || response.statusText || "Error al crear usuario");
      }

      alert("Usuario creado con éxito");
      setTimeout(() => navigate("/usuarios/listar"), 1500);
      return data;
    } catch (err) {
      console.error("Error completo:", err);
      throw err;
    }
  };

  return <UserForm mode="create" onSubmit={handleCreate} />;
}
