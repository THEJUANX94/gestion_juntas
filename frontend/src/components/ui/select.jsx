import { useState } from "react";

export function Select({ options = [], placeholder = "Seleccione...", onChange }) {
  const [value, setValue] = useState("");

  return (
    <select
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
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
