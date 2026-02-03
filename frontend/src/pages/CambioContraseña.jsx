import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2'; // Opcional para alertas bonitas

export default function ChangePassword() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      return Swal.fire('Error', 'Las nuevas contraseñas no coinciden', 'error');
    }

    if (formData.newPassword.length < 6) {
      return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_PATH}/usuarios/cambiar-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
        navigate(-1); // Volver atrás
      } else {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Volver
      </button>

      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <KeyRound className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Cambiar Contraseña</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input
              type="password"
              name="oldPassword"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.oldPassword}
              onChange={handleChange}
            />
          </div>

          <hr className="my-4" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input
              type={showPass ? "text" : "password"}
              name="newPassword"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                name="confirmPassword"
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-semibold text-white transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
          >
            <Save className="h-5 w-5" />
            {loading ? 'Procesando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}