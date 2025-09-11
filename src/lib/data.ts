"use server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Alert,
  Kpis,
  type ClientWithStatus,
  type DeviceWithStatus,
} from "./types";

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

// Obtiene las lecturas de sensores para un dispositivo en un rango de tiempo
export async function fetchReadingsForDevice(
  supabase: SupabaseClient,
  deviceId: string,
  from: string,
  to: string
) {
  const { data, error } = await supabase
    .from("sensor_readings")
    .select(
      `
            timestamp, 
            ambient_temp, 
            ambient_hum, 
            current_a, 
            current_b, 
            probe_temperatures
        `
    )
    .eq("device_id", deviceId)
    .gte("timestamp", from)
    .lte("timestamp", to)
    .order("timestamp", { ascending: true });

  if (error) throw error;
  return data;
}

// Llama a nuestra nueva función RPC para el consumo de corriente
export async function fetchHourlyCurrentAverage(
  supabase: SupabaseClient,
  deviceId: string,
  from: string,
  to: string
) {
  const { data, error } = await supabase.rpc("get_hourly_current_average", {
    p_device_id: deviceId,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return data;
}

// Obtiene el historial de alertas
export async function fetchAlertsForDevice(
  supabase: SupabaseClient,
  deviceId: string
) {
  const { data, error } = await supabase
    .from("alerts")
    .select("*") // Seleccionamos todos los campos de la alerta
    .eq("device_id", deviceId) // Filtramos por el ID del dispositivo
    .order("timestamp", { ascending: false }) // Mostramos las más recientes primero
    .limit(50); // Limitamos a las últimas 50 para no sobrecargar la UI

  if (error) {
    console.error("Error fetching alerts for device:", error);
    throw new Error("No se pudo cargar el historial de alertas.");
  }
  return data;
}

// --- FUNCIÓN PARA OBTENER LOS KPIS DEL SUPER ADMIN ---
export async function fetchSuperAdminKpis(
  supabase: SupabaseClient
): Promise<Kpis> {
  // Llama a la función RPC que creamos, la cual hace todo el cálculo pesado en la DB.
  const { data, error } = await supabase.rpc("get_super_admin_kpis");

  if (error) {
    console.error("Error fetching Super Admin KPIs:", error);
    throw new Error("No se pudieron cargar los indicadores clave.");
  }

  // La RPC devuelve un único objeto JSON que coincide con nuestra interfaz Kpis.
  return data;
}

// --- FUNCIÓN PARA OBTENER LAS ALERTAS MÁS RECIENTES ---
export async function fetchRecentAlerts(
  supabase: SupabaseClient
): Promise<Alert[]> {
  const { data, error } = await supabase
    .from("alerts")
    // Pedimos todos los campos de la alerta y, usando joins,
    // traemos el nombre del cliente y la ubicación del dispositivo.
    .select(
      `
      *,
      clients ( name ),
      devices ( location )
    `
    )
    // Ordenamos por la más reciente primero.
    .order("timestamp", { ascending: false })
    // Limitamos el resultado a las últimas 5 alertas.
    .limit(5);

  if (error) {
    console.error("Error fetching recent alerts:", error);
    throw new Error("No se pudieron cargar las alertas recientes.");
  }

  return data as Alert[];
}
