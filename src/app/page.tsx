import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Esta página es un Componente de Servidor que se ejecuta para la ruta '/'
export default async function HomePage() {
  const supabase = await createClient();

  // 1. Obtenemos el usuario actual de forma segura en el servidor
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Lógica de Redirección Basada en el Rol
  if (!user) {
    // Si no hay ningún usuario logueado, lo enviamos a la página de inicio de sesión.
    redirect("/login");
  }

  const role = user.app_metadata.role;
  const clientId = user.app_metadata.client_id;

  if (role === "super_admin") {
    // Si es super_admin, lo enviamos a su dashboard principal.
    redirect("/2a/dashboard");
  } else if (role === "client_admin" && clientId) {
    // Si es un admin de cliente, lo enviamos al dashboard de su cliente.
    redirect(`/${clientId}/admin/dashboard`);
  } else if (role === "client_viewer" && clientId) {
    // Si es un visualizador de cliente, lo enviamos al dashboard de su cliente.
    redirect(`/${clientId}/viewer/dashboard`);
  } else {
    // Si por alguna razón el usuario está logueado pero no tiene un rol válido,
    // lo enviamos al login como medida de seguridad.
    redirect("/login");
  }

  // Este componente nunca renderiza nada visible, ya que siempre redirige.
  // Devolvemos null para satisfacer a React.
  return null;
}
