import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDevicesWithLatestReadingsForClient } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const supabase = await createClient();
  const clientIdFromUrl = params.clientId;

  // Verificación de seguridad
  if (!clientIdFromUrl) {
    return NextResponse.json(
      { error: "Client ID es requerido" },
      { status: 400 }
    );
  }
  try {
    // La lógica de validación de usuario y rol sigue igual...
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const isSuperAdmin = user.app_metadata.role === "super_admin";
    const isCorrectClientUser = user.app_metadata.client_id === clientIdFromUrl;

    if (!isSuperAdmin && !isCorrectClientUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const devices = await fetchDevicesWithLatestReadingsForClient(
      supabase,
      clientIdFromUrl
    );
    return NextResponse.json(devices);
  } catch (error) {
    console.error(
      `Error en API Route /api/clients/${clientIdFromUrl}/devices:`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "Un error desconocido ocurrió.";
    return NextResponse.json(
      { error: `Error interno: ${errorMessage}` },
      { status: 500 }
    );
  }
}
