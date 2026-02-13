import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import UserForm from "./UserForm";

export default function EditUser() {
  const { id: IDUsuario } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.VITE_PATH + `/usuarios/${IDUsuario}`)
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch((err) => console.error("Error al cargar usuario:", err));
  }, [IDUsuario]);

const handleUpdate = async (form) => {
  try {
    const response = await fetch(import.meta.env.VITE_PATH + `/usuarios/${IDUsuario}`, {
      method: "PUT",
      credentials: 'include',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error("Error al actualizar usuario");
    }

    const updatedUser = await response.json();
    setUser(updatedUser);



    setTimeout(() => navigate("/"), 1500);

    return updatedUser;

  } catch (err) {
    console.error(" Error al actualizar:", err);
    throw err;
  }
};



  return user ? (
    <UserForm mode="edit" initialData={user} onSubmit={handleUpdate} />
  ) : (
    <p className="text-center">Cargando...</p>
  );
}