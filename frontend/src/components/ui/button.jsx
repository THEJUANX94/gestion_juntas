export function Button({ children, className = "", variant = "default", ...props }) {
  const base =
    "px-4 py-2 rounded-xl shadow font-medium transition-colors";
  const variants = {
  default: "bg-boyaca-green text-white hover:bg-green-800 transition-colors",
  outline: "border border-gray-300 text-boyaca-dark hover:bg-gray-100",
  danger: "bg-boyaca-red text-white hover:bg-red-800",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
