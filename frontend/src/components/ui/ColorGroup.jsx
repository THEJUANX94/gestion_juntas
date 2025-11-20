export default function ColorGroup({ label, colors, onChange }) {
  return (
    <div>
      <h4 className="text-sm font-medium mb-1">{label}</h4>
      <div className="flex gap-2">
        {colors.map((color, idx) => (
          <input
            key={idx}
            type="color"
            value={color}
            onChange={(e) => onChange(idx, e.target.value)}
            className="w-12 h-8 rounded border"
          />
        ))}
      </div>
    </div>
  );
}
