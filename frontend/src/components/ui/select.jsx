export function Select({ options = [], placeholder = "Seleccione...", onChange, value = "", disabled = false }) {
  return (
    <select
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      disabled={disabled}
      onChange={(e) => {
        if (onChange) onChange(e.target.value);
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
