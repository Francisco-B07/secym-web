import { createClient } from "@/lib/supabase/server";
import {
  fetchClientDetails,
  fetchDevicesWithLatestReadingsForClient,
  fetchUsersForClient,
} from "@/lib/data";
import ClientDashboardContent from "@/components/dashboard/client-admin/ClientDashboardContent";
import { redirect } from "next/navigation";
import { type User, type DeviceWithStatus } from "@/lib/types";

export default async function ClientAdminDashboardPage({
  params,
}: {
  params: { client_id: string };
}) {
  const supabase = await createClient();

  // 1. Seguridad
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }
  const userRole = user.app_metadata.role;
  const userClientId = user.app_metadata.client_id;
  const isSuperAdmin = userRole === "super_admin";
  const isCorrectClientUser =
    (userRole === "client_admin" || userRole === "client_viewer") &&
    userClientId === params.client_id;

  if (!isSuperAdmin && !isCorrectClientUser) {
    return redirect("/unauthorized");
  }

  const clientId = params.client_id;

  // 2. Carga de Datos Iniciales
  const [clientResult, devicesResult, usersResult] = await Promise.allSettled([
    fetchClientDetails(supabase, clientId),
    fetchDevicesWithLatestReadingsForClient(supabase, clientId),
    fetchUsersForClient(supabase, clientId),
  ]);

  const client =
    clientResult.status === "fulfilled" ? clientResult.value : null;
  if (!client) {
    return (
      <div className="text-center p-8">
        Error: No se pudo encontrar al cliente.
      </div>
    );
  }
  const initialDevices =
    devicesResult.status === "fulfilled" ? devicesResult.value : [];
  const initialUsers =
    usersResult.status === "fulfilled" ? usersResult.value : [];

  // 3. Renderizado del Componente de Cliente
  // La página del servidor simplemente delega toda la renderización interactiva
  // a nuestro nuevo componente de cliente, pasándole los datos iniciales.
  return (
    <ClientDashboardContent
      clientId={params.client_id}
      clientName={client.name ?? ""}
      initialDevices={initialDevices as DeviceWithStatus[]}
      initialUsers={initialUsers as User[]}
      userRole={userRole}
    />
  );
}
