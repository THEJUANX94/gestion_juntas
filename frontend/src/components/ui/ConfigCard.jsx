import { Card, CardContent } from "@/components/ui/card";

export default function ConfigCard({ title, children }) {
  return (
    <Card className="shadow-md">
      <CardContent>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}
