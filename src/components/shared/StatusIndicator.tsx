interface StatusIndicatorProps {
  status: "ok" | "warning" | "critical" | "offline";
}

export default function StatusIndicator({ status }: StatusIndicatorProps) {
  const statusConfig = {
    ok: { color: "bg-green-500", label: "OK" },
    warning: { color: "bg-yellow-500", label: "Advertencia" },
    critical: { color: "bg-red-500", label: "Crítico" },
    offline: { color: "bg-gray-500", label: "Offline" },
  };

  const { color, label } = statusConfig[status];

  return (
    <div className="flex items-center space-x-2">
      <span className={`h-3 w-3 rounded-full ${color}`}></span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );
}
