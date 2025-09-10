import { createClient } from "@/lib/supabase/server";
import {
  fetchDeviceDetails,
  fetchReadingsForDevice,
  fetchHourlyCurrentAverage,
  fetchAlertsForDevice,
} from "@/lib/data";
import DeviceDashboard from "@/components/dashboard/device-detail/DeviceDashboard";
import { subDays, formatISO } from "date-fns";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ device_id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export default async function DeviceDetailPage({
  params,
  searchParams,
}: Props) {
  const { from: fromParam, to: toParam } = await searchParams;
  const { device_id } = await params;

  if (!device_id || !UUID_REGEX.test(device_id)) {
    notFound();
  }
  const supabase = await createClient();

  // 1. OBTENEMOS EL USUARIO Y SU ROL
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  // Extraemos el rol para pasarlo como prop
  const userRole = user.app_metadata.role;

  const to = toParam ? new Date(toParam) : new Date();
  const from = fromParam ? new Date(fromParam) : subDays(to, 2); // 2 días por defecto

  // Cargamos todos los datos en paralelo
  const [device, readings, hourlyCurrent, alerts] = await Promise.all([
    fetchDeviceDetails(supabase, device_id),
    fetchReadingsForDevice(supabase, device_id, formatISO(from), formatISO(to)),
    fetchHourlyCurrentAverage(
      supabase,
      device_id,
      formatISO(from),
      formatISO(to)
    ),
    fetchAlertsForDevice(supabase, device_id),
  ]);

  if (!device) {
    notFound();
  }
  return (
    <DeviceDashboard
      initialReadings={readings}
      hourlyCurrent={hourlyCurrent}
      alerts={alerts}
      device={device}
      userRole={userRole}
    />
  );
}
