import { Select } from "./select";

export default function FormSelect({ 
  label, 
  value, 
  onChange, 
  options = [], 
  placeholder = "Seleccionar", 
  disabled = false,
  error 
}) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
