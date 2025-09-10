import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";

// --- 1. DEFINIMOS LOS TIPOS DE DATOS ---
// Estos "contratos" le dicen a Deno exactamente qué forma tienen nuestros objetos.

interface ProbeConfig {
  id: string;
  name: string;
  alerts_enabled: boolean;
}

interface SensorReading {
  timestamp: string;
  probe_temperatures: number[] | null;
}

interface Client {
  name: string;
}

interface DeviceWithRelations {
  id: string;
  client_id: string;
  location: string;
  node_id: string;
  device_type: "refrigerator" | "hvac";
  min_temp_threshold: number | null;
  max_temp_threshold: number | null;
  offline_threshold_minutes: number;
  sensor_config?: {
    probes?: ProbeConfig[];
  };
  clients: Client; // El join nos asegura que 'clients' no es nulo si el dispositivo existe
  sensor_readings: SensorReading[];
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);

// --- FUNCIÓN PRINCIPAL DEL SERVIDOR ---
serve(async (req: Request) => {
  // 1. Seguridad
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 2. Obtener dispositivos. El tipo de 'data' ahora se infiere como DeviceWithRelations[]
  const { data: devices, error: deviceError } = await supabaseAdmin
    .from("devices")
    .select(
      `
      *,
      clients ( name ),
      sensor_readings ( timestamp, probe_temperatures )
    `
    )
    .order("timestamp", { foreignTable: "sensor_readings", ascending: false })
    .limit(1, { foreignTable: "sensor_readings" });

  if (deviceError) throw deviceError;

  for (const device of devices as DeviceWithRelations[]) {
    const lastReading = device.sensor_readings[0];
    const now = new Date();

    // A. Alerta de Desconexión
    const offlineMinutes = device.offline_threshold_minutes;
    if (
      !lastReading ||
      new Date(lastReading.timestamp) <
        new Date(now.getTime() - offlineMinutes * 60000)
    ) {
      await createAlertAndNotify(
        supabaseAdmin,
        device,
        "OFFLINE",
        `El equipo no envía datos hace más de ${offlineMinutes} min.`
      );
      continue;
    }

    // B. Alerta de Umbral Crítico
    if (
      device.device_type === "refrigerator" &&
      device.min_temp_threshold != null &&
      device.max_temp_threshold != null
    ) {
      const probeReadings: number[] = lastReading.probe_temperatures || [];

      probeReadings.forEach((temp, index) => {
        const probeKey = `probe_${index}`;

        const probeConfig = device.sensor_config?.probes?.find(
          (p: ProbeConfig) => p.id === probeKey
        );

        if (probeConfig?.alerts_enabled) {
          if (
            temp < device.min_temp_threshold! ||
            temp > device.max_temp_threshold!
          ) {
            const probeName = probeConfig.name || `Sonda ${index + 1}`;
            createAlertAndNotify(
              supabaseAdmin,
              device,
              "TEMP_CRITICAL",
              `${probeName} fuera de rango: ${temp.toFixed(1)}°C. (Permitido: ${
                device.min_temp_threshold
              }°C - ${device.max_temp_threshold}°C)`
            );
          }
        }
      });
    }
  }

  return new Response(JSON.stringify({ message: "Alert check complete." }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});

// --- FUNCIÓN DE AYUDA  ---
async function createAlertAndNotify(
  supabase: SupabaseClient,
  device: DeviceWithRelations,
  type: string,
  details: string
) {
  const { data: existingAlerts } = await supabase
    .from("alerts")
    .select("id")
    .eq("device_id", device.id)
    .eq("alert_type", type)
    .eq("status", "new")
    .limit(1);

  if (existingAlerts && existingAlerts.length > 0) {
    console.log(
      `Alert ${type} for device ${device.id} already exists. Skipping.`
    );
    return;
  }

  await supabase.from("alerts").insert({
    device_id: device.id,
    client_id: device.client_id,
    alert_type: type,
    details: details,
  });

  const { data: usersToNotify } = await supabase
    .from("users_with_details")
    .select("email")
    .or(
      `role.eq.super_admin,and(role.eq.client_admin,client_id.eq.${device.client_id})`
    );

  if (!usersToNotify || usersToNotify.length === 0) return; // CORREGIDO: 'u' ahora tiene un tipo explícito
  const emails = usersToNotify.map((u: { email: string }) => u.email);

  try {
    await resend.emails.send({
      from: "alertas@tu-dominio.com",
      to: emails,
      subject: `[ALERTA 2A] ${type} en ${device.clients.name}`,
      html: `
        <h1>Alerta de Monitoreo - 2A</h1>
        <p>Se ha detectado una nueva alerta:</p>
        <ul>
          <li><strong>Cliente:</strong> ${device.clients.name}</li>
          <li><strong>Equipo:</strong> ${device.location} (Nodo: ${
        device.node_id
      })</li>
          <li><strong>Tipo de Alerta:</strong> ${type}</li>
          <li><strong>Detalles:</strong> ${details}</li>
          <li><strong>Fecha:</strong> ${new Date().toLocaleString("es-AR")}</li>
        </ul>
        <p>Puedes ver más detalles en el dashboard.</p>
      `,
    });
  } catch (e) {
    console.error("Error sending email:", e);
  }
}
