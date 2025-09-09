import { type Alert } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AlertsTableProps {
  alerts: Alert[];
}

// Mapeo de estados y tipos a estilos y textos legibles
const statusConfig = {
  new: { text: "Nueva", style: "bg-blue-100 text-blue-800" },
  acknowledged: { text: "Reconocida", style: "bg-gray-100 text-gray-800" },
  resolved: { text: "Resuelta", style: "bg-green-100 text-green-800" },
};

const alertTypeConfig = {
  TEMP_CRITICAL: "Temperatura Crítica",
  CURRENT_HIGH: "Corriente Elevada",
  OFFLINE: "Equipo Offline",
};

export default function AlertsTable({ alerts }: AlertsTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">Sin Alertas</h3>
        <p className="mt-1 text-sm text-gray-500">
          No hay alertas registradas para este dispositivo en el rango de tiempo
          seleccionado.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Fecha y Hora
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Tipo de Alerta
                </th>
                <th
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  Detalles
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-0">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        statusConfig[alert.status].style
                      }`}
                    >
                      {statusConfig[alert.status].text}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {format(
                      new Date(alert.timestamp),
                      "dd MMM yyyy, HH:mm:ss",
                      { locale: es }
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {alertTypeConfig[alert.alert_type]}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {alert.details || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
