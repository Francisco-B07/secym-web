import { createClient } from "@/lib/supabase/server";
import {
  fetchClientDetails,
  fetchDevicesWithLatestReadingsForClient,
  fetchUsersForClient,
} from "@/lib/data";
import ClientDashboardContent from "@/components/dashboard/client-admin/ClientDashboardContent";
import { redirect } from "next/navigation";
import { type User, type DeviceWithStatus } from "@/lib/types";

type PageProps = {
  params: { client_id: string };
};

export default async function ClientAdminDashboardPage({ params }: PageProps) {
  const { client_id } = await params;
  const supabase = await createClient();

  // 2. SEGURIDAD: Validamos la sesión y los permisos del usuario en el servidor
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
    userClientId === client_id;

  if (!isSuperAdmin && !isCorrectClientUser) {
    return redirect("/unauthorized");
  }

  // 3. OBTENCIÓN DE DATOS: Usamos nuestra constante 'client_id'
  const [clientResult, devicesResult, usersResult] = await Promise.allSettled([
    fetchClientDetails(supabase, client_id),
    fetchDevicesWithLatestReadingsForClient(supabase, client_id),
    fetchUsersForClient(supabase, client_id),
  ]);

  const client =
    clientResult.status === "fulfilled" ? clientResult.value : null;
  if (!client) {
    // Si el cliente no se encuentra (ej. ID inválido en la URL), redirigimos o mostramos error.
    return redirect("/2a/dashboard"); // O a una página de error 404
  }
  const initialDevices =
    devicesResult.status === "fulfilled" ? devicesResult.value : [];
  const initialUsers =
    usersResult.status === "fulfilled" ? usersResult.value : [];

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
