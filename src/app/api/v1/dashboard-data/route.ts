import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchAllUsersWithProfiles,
  fetchClientsWithStatus,
  fetchRecentAlerts,
  fetchSuperAdminKpis,
} from "@/lib/data";

// Forzamos a que esta ruta no sea cacheada estáticamente.
// Siempre debe ejecutarse en el servidor para validar la sesión del usuario.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();

  // 1. Validar la sesión del usuario
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // 2. Validar que el usuario tenga el rol correcto
  if (user.app_metadata.role !== "super_admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // 3. Obtener todos los datos necesarios en paralelo
    const [clients, users, kpis, alerts] = await Promise.all([
      fetchClientsWithStatus(supabase),
      fetchAllUsersWithProfiles(supabase),
      fetchSuperAdminKpis(supabase),
      fetchRecentAlerts(supabase),
    ]);

    // 4. Devolver los datos en una respuesta JSON
    return NextResponse.json({ clients, users, kpis, alerts });
  } catch (error) {
    console.error("Error en API Route 'dashboard-data':", error);
    const errorMessage =
      error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return NextResponse.json(
      { error: `Error interno del servidor: ${errorMessage}` },
      { status: 500 }
    );
  }
}
