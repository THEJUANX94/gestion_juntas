import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const baseConfig = {
  background: "#ffffff",
  color: "#1b4332",
  confirmButtonColor: "#2d6a4f",
  cancelButtonColor: "#d00000",
  backdrop: `rgba(0, 0, 0, 0.4)`,
  customClass: {
    popup: "rounded-3xl shadow-2xl border border-green-700",
    title: "font-bold text-2xl text-green-800",
    confirmButton: "px-4 py-2 rounded-lg font-semibold",
  },
  showClass: {
    popup: "animate__animated animate__fadeInDown",
  },
  hideClass: {
    popup: "animate__animated animate__fadeOutUp",
  },
};

export const AlertMessage = {
  success: (title = "Éxito", text = "Operación realizada correctamente") => {
    MySwal.fire({
      ...baseConfig,
      icon: "success",
      title,
      text,
      confirmButtonText: "Aceptar",
      timer: 2000,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  },

  error: (title = "Error", text = "Ocurrió un problema") => {
    MySwal.fire({
      ...baseConfig,
      icon: "error",
      title,
      text,
      confirmButtonText: "Entendido",
      showConfirmButton: true,
    });
  },

  info: (title = "Información", text = "") => {
    MySwal.fire({
      ...baseConfig,
      icon: "info",
      title,
      text,
      confirmButtonText: "Ok",
    });
  },

  confirm: async (
    title = "¿Estás seguro?",
    text = "Esta acción no se puede deshacer"
  ) => {
    const result = await MySwal.fire({
      ...baseConfig,
      icon: "warning",
      title,
      text,
      showCancelButton: true,
      confirmButtonText: "Sí, continuar",
      cancelButtonText: "Cancelar",
    });
    return result.isConfirmed;
  },
};
