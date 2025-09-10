import { type ElementType } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  Icon: ElementType;
  colorClass: string; // ej. 'text-blue-500'
}

export default function StatCard({
  title,
  value,
  Icon,
  colorClass,
}: StatCardProps) {
  return (
    <div
      className="bg-white p-5 rounded-lg shadow-md flex items-center border-l-4"
      style={{
        borderColor: colorClass.replace("text-", "").replace("-500", ""),
      }}
    >
      <div className={`p-3 rounded-full mr-4 bg-gray-100`}>
        <Icon className={`h-6 w-6 ${colorClass}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
