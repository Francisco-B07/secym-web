"use server";
import { SupabaseClient } from "@supabase/supabase-js";
import { type ClientWithStatus, type DeviceWithStatus } from "./types";

// --- PARA LA VISTA DEL SUPER ADMIN ---
export async function fetchClientsWithStatus(
  supabase: SupabaseClient
): Promise<ClientWithStatus[]> {
  // Esta es una consulta compleja. Por ahora, la simplificaremos.
  // En una versión más avanzada, esto se podría optimizar con una función de base de datos (RPC).
  const { data: clients, error: clientError } = await supabase
    .from("clients")
    .select("*");
  if (clientError) throw clientError;

  // Simularemos los estados por ahora. En producción, aquí harías más consultas
  // para agregar el estado de los dispositivos de cada cliente.
  return clients.map((client) => ({
    ...client,
    device_status_counts: {
      ok: Math.floor(Math.random() * 10),
      warning: Math.floor(Math.random() * 2),
      critical: Math.floor(Math.random() * 1),
      offline: 0,
    },
  }));
}

// --- PARA LA VISTA DE CLIENTE ---
export async function fetchDevicesForClient(
  supabase: SupabaseClient,
  clientId: string
): Promise<DeviceWithStatus[]> {
  const { data: devices, error } = await supabase
    .from("devices")
    .select("*")
    .eq("client_id", clientId);

  if (error) throw error;

  // Por ahora, simularemos el estado y la última lectura.
  // Esto también se optimizaría en producción con una sola consulta más compleja.
  return devices.map((device) => ({
    ...device,
    latest_reading: {
      timestamp: new Date().toISOString(),
      ambient_temp: 22 + (Math.random() * 5 - 2.5),
    },
    status: ["ok", "warning", "critical"][Math.floor(Math.random() * 3)] as
      | "ok"
      | "warning"
      | "critical",
  }));
}

// --- PARA LA VISTA DE DISPOSITIVO ---
export async function fetchDeviceDetails(
  supabase: SupabaseClient,
  deviceId: string
) {
  const { data, error } = await supabase
    .from("devices")
    .select("*")
    .eq("id", deviceId)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchSensorReadings(
  supabase: SupabaseClient,
  deviceId: string,
  from: string,
  to: string
) {
  const { data, error } = await supabase
    .from("sensor_readings")
    .select("timestamp, ambient_temp, probe_temperatures")
    .eq("device_id", deviceId)
    .gte("timestamp", from)
    .lte("timestamp", to)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data;
}

export async function fetchClientDetails(
  supabase: SupabaseClient,
  clientId: string
) {
  const { data, error } = await supabase
    .from("clients")
    .select("name")
    .eq("id", clientId)
    .single();
  if (error) throw error;
  return data;
}

//  FUNCIÓN para obtener todos los usuarios con sus perfiles y nombres de cliente
export async function fetchAllUsersWithProfiles(supabase: SupabaseClient) {
  // Simplemente consultamos nuestra nueva VISTA como si fuera una tabla normal
  const { data, error } = await supabase
    .from("users_with_details") // <-- Usamos la VISTA
    .select("*");

  if (error) {
    console.error("Error fetching users from view:", error);
    return [];
  }

  return data.map((u) => ({
    id: u.id,
    email: u.email ?? "N/A",
    role: u.role,
    clientId: u.client_id,
    clientName: u.client_name ?? "N/A",
  }));
}

// Obtiene dispositivos con su última lectura de forma eficiente
export async function fetchDevicesWithLatestReadingsForClient(
  supabase: SupabaseClient,
  clientId: string
): Promise<DeviceWithStatus[]> {
  const { data, error } = await supabase.rpc(
    "get_devices_with_status_for_client",
    { p_client_id: clientId }
  );

  if (error) {
    // Este error será informativo si algo sale mal en la RPC
    console.error("Error calling RPC function:", error);
    throw new Error("No se pudieron cargar los datos de los dispositivos.");
  }

  // Como la RPC devuelve SETOF, 'data' ya es un array. No se necesita ninguna otra lógica.
  return (data as DeviceWithStatus[]) || [];
}

//  Obtiene solo los usuarios de un cliente específico
export async function fetchUsersForClient(
  supabase: SupabaseClient,
  clientId: string
) {
  const { data, error } = await supabase
    .from("users_with_details") // Usamos nuestra VISTA
    .select("*")
    .eq("client_id", clientId);

  if (error) throw error;
  return data;
}
