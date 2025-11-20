import { Input } from "./input";

export default function FormField({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  disabled = false,
  error 
}) {
  const inputId = label.replace(/\s+/g, "_").toLowerCase();

  return (
    <div>
      <label htmlFor={inputId} className="text-sm">{label}</label>
      <Input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`${error ? "border-red-500" : ""} ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
