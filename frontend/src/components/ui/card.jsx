export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-xl shadow-md bg-white border border-gray-200 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
