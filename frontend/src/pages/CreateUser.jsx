import { useNavigate } from "react-router-dom";
import UserForm from "./UserForm";

export default function CreateUser() {
  const navigate = useNavigate();

  const handleCreate = async (form) => {
    try {
      console.log('Form data being sent:', form);
      
      const response = await fetch(import.meta.env.VITE_PATH + "/usuarios", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          NombreRol: form.NombreRol
        })
      });

      const data = await response.json(); 

      if (!response.ok) {
        console.error('Server error details:', data);
        throw new Error(data.message || "Error al crear usuario");
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
