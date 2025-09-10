import { type Alert } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const alertTypeConfig: Record<string, string> = {
  TEMP_CRITICAL: "Temperatura Crítica",
  CURRENT_HIGH: "Corriente Elevada",
  OFFLINE: "Equipo Offline",
};

export default function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  if (!alerts || alerts.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center mt-4">
        No hay alertas recientes.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="p-3 bg-white border rounded-md">
          <p className="font-semibold text-sm text-gray-800">
            {alertTypeConfig[alert.alert_type] || alert.alert_type}
          </p>
          <p className="text-sm text-gray-600">{alert.details}</p>
          <p className="text-xs text-gray-400 mt-1">
            {format(new Date(alert.timestamp), "dd MMM, HH:mm", { locale: es })}
          </p>
        </div>
      ))}
    </div>
  );
}
