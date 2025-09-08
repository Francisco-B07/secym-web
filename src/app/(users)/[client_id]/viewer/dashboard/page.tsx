import { createClient } from "@/lib/supabase/server";
import { fetchClientDetails, fetchDevicesForClient } from "@/lib/data";
import Link from "next/link";
import StatusIndicator from "@/components/shared/StatusIndicator";

interface Props {
  params: Promise<{ client_id: string }>;
}

export default async function ClientDashboard({ params }: Props) {
  const { client_id } = await params;
  const supabase = await createClient();
  const [client, devices] = await Promise.all([
    fetchClientDetails(supabase, client_id),
    fetchDevicesForClient(supabase, client_id),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard de Cliente: {client?.name}
        </h1>
        <p className="text-gray-600 mt-1">
          Estado de los equipos de climatización y refrigeración.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Link
            href={`/devices/${device.id}`}
            key={device.id}
            className="block p-6 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {device.location}
                </h3>
                <p className="text-sm text-gray-500">Nodo: {device.node_id}</p>
              </div>
              <StatusIndicator status={device.status} />
            </div>
            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-gray-600">Última T° Ambiente:</p>
              <p className="text-2xl font-bold text-gray-900">
                {device.latest_reading?.ambient_temp?.toFixed(1) ?? "N/A"} °C
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
