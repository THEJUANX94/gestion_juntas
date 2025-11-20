export default function ActionButton({ 
  children, 
  onClick, 
  variant = "primary", 
  disabled 
}) {
  const base = "px-4 py-2 rounded-md shadow font-medium transition-colors";
  const styles = {
    primary: "bg-blue-500 text-white hover:bg-blue-600",
    danger: "bg-red-500 text-white hover:bg-red-600",
    outline: "bg-white text-gray-700 border hover:bg-gray-100",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}
