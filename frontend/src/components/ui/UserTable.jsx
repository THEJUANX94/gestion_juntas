import { User, Edit, Trash2 } from "lucide-react";

export default function UserTable({ 
  usuarios, 
  showActions = false, 
  onEdit, 
  onDelete 
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Usuario</th>
            <th className="px-4 py-2 border">Documento</th>
            {showActions && <th className="px-4 py-2 border">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u, idx) => (
            <tr
              key={idx}
              className="hover:bg-gray-100 transition-colors"
            >
              <td className="px-4 py-2 border flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600" /> {u.nombre}
              </td>
              <td className="px-4 py-2 border">{u.documento}</td>
              {showActions && (
                <td className="px-4 py-2 border flex gap-2">
                  <button
                    onClick={() => onEdit && onEdit(u)}
                    className="p-1 rounded hover:bg-blue-100"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(u)}
                    className="p-1 rounded hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
