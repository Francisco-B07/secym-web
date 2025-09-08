import { createClient } from "@/lib/supabase/server";
import { fetchDeviceDetails, fetchSensorReadings } from "@/lib/data";
import TemperatureChart from "@/components/dashboard/charts/TemperatureChart";
import { subDays, formatISO } from "date-fns";

export default async function DeviceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ device_id: string }>;
  searchParams: { from?: string; to?: string };
}) {
  const { device_id } = await params;
  const supabase = await createClient();
  const device = await fetchDeviceDetails(supabase, device_id);

  // Lógica para el selector de fechas
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const from = searchParams.from ? new Date(searchParams.from) : subDays(to, 1);

  const readings = await fetchSensorReadings(
    supabase,
    device_id,
    formatISO(from),
    formatISO(to)
  );

  // Transformamos los datos para el gráfico
  const chartData = readings.map((r) => ({
    timestamp: r.timestamp,
    // Asumimos que la primera sonda de temperatura en el JSONB se llama 'probe_1'
    probe_1: r.probe_temperatures?.["probe_1"] ?? null,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Dispositivo: {device.location}
        </h1>
        <p className="text-gray-600 mt-1">Node ID: {device.node_id}</p>
      </header>

      {/* Aquí añadiríamos el DateRangePicker */}

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          Monitoreo de Temperatura Crítica (Heladera)
        </h2>
        <TemperatureChart
          data={chartData}
          minThreshold={2} // Umbral para vacunas, por ejemplo
          maxThreshold={8} // Umbral para vacunas, por ejemplo
        />
      </div>

      {/* Aquí añadiríamos más gráficos para corriente, etc. */}
    </div>
  );
}
