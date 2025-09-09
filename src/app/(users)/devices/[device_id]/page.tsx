import { createClient } from "@/lib/supabase/server";
import {
  fetchDeviceDetails,
  fetchReadingsForDevice,
  fetchHourlyCurrentAverage,
  fetchAlertsForDevice,
} from "@/lib/data";
import DeviceDashboard from "@/components/dashboard/device-detail/DeviceDashboard";
import { subDays, formatISO } from "date-fns";

export default async function DeviceDetailPage({
  params,
  searchParams,
}: {
  params: { deviceId: string };
  searchParams: { from?: string; to?: string };
}) {
  const supabase = await createClient();
  const to = searchParams.to ? new Date(searchParams.to) : new Date();
  const from = searchParams.from ? new Date(searchParams.from) : subDays(to, 2); // 2 días por defecto

  // Cargamos todos los datos en paralelo
  const [device, readings, hourlyCurrent, alerts] = await Promise.all([
    fetchDeviceDetails(supabase, params.deviceId),
    fetchReadingsForDevice(
      supabase,
      params.deviceId,
      formatISO(from),
      formatISO(to)
    ),
    fetchHourlyCurrentAverage(
      supabase,
      params.deviceId,
      formatISO(from),
      formatISO(to)
    ),
    fetchAlertsForDevice(supabase, params.deviceId),
  ]);

  return (
    <DeviceDashboard
      initialReadings={readings}
      hourlyCurrent={hourlyCurrent}
      alerts={alerts}
      device={device}
    />
  );
}
