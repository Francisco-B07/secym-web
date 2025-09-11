import { type Alert } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

// Reutilizamos la misma configuración de estilos que en AlertsTable para consistencia
const statusConfig: Record<string, { text: string; style: string }> = {
  new: { text: "Nueva", style: "bg-red-100 text-red-800" },
  acknowledged: { text: "Reconocida", style: "bg-yellow-100 text-yellow-800" },
  resolved: { text: "Resuelta", style: "bg-green-100 text-green-800" },
};

const alertTypeConfig: Record<string, string> = {
  TEMP_CRITICAL: "Temperatura Crítica",
  CURRENT_HIGH: "Corriente Elevada",
  OFFLINE: "Equipo Offline",
};

// Extender el tipo Alert para incluir los datos de las relaciones que ya estamos obteniendo
type AlertWithRelations = Alert & {
  clients: { name: string } | null;
  devices: { location: string } | null;
};

export default function AlertsFeed({
  alerts,
}: {
  alerts: AlertWithRelations[];
}) {
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
        // Hacemos que toda la alerta sea un enlace a la página del dispositivo afectado
        <Link
          href={`/devices/${alert.device_id}`}
          key={alert.id}
          className="block p-3 bg-white border rounded-md hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between items-start">
            <p className="font-semibold text-sm text-gray-800 pr-2">
              {alertTypeConfig[alert.alert_type] || alert.alert_type}
            </p>
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                statusConfig[alert.status]?.style || "bg-gray-100 text-gray-800"
              }`}
            >
              {statusConfig[alert.status]?.text || alert.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{alert.details}</p>
          <div className="text-xs text-gray-500 mt-2 gap-2">
            <p>
              <span className="font-bold text-gray-700">Cliente: </span>
              <span className="font-medium">{alert.clients?.name}</span>
            </p>
            <p>
              <span className="font-bold text-gray-700">Nodo: </span>
              <span className="font-medium">{alert.devices?.location}</span>
            </p>
            <p className="mt-1">
              {formatDistanceToNow(new Date(alert.timestamp), {
                addSuffix: true,
                locale: es,
              })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
