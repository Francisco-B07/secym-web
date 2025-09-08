import type { ElementType } from "react";

// Definimos los posibles estados de una métrica para un tipado más estricto
type MetricStatus = "normal" | "warning" | "danger";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: MetricStatus;
  Icon: ElementType; // Usamos ElementType para poder pasar un componente como prop
}

// Un objeto para mapear el estado a los estilos de Tailwind CSS. ¡Mucho más limpio!
const statusStyles: Record<MetricStatus, { text: string; icon: string }> = {
  normal: { text: "text-green-600", icon: "text-green-500" },
  warning: { text: "text-yellow-600", icon: "text-yellow-500" },
  danger: { text: "text-red-600", icon: "text-red-500" },
};

export default function MetricCard({
  title,
  value,
  unit,
  status,
  Icon,
}: MetricCardProps) {
  const styles = statusStyles[status];

  return (
    <div className="p-6 bg-white rounded-lg shadow transition-transform hover:scale-105">
      <div className="flex items-center">
        <Icon className={`h-8 w-8 ${styles.icon}`} />
        <h3 className="ml-3 text-lg font-medium text-gray-700">{title}</h3>
      </div>
      <p className="mt-4 text-4xl font-bold text-gray-900">
        {value}
        <span className="text-2xl text-gray-500 ml-1">{unit}</span>
      </p>
      <p className={`mt-1 text-sm font-medium ${styles.text}`}>
        Estado: <span className="capitalize">{status}</span>
      </p>
    </div>
  );
}
