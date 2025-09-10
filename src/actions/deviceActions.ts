"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Esquema de validación para la actualización
const UpdateLocationSchema = z.object({
  deviceId: z.string().uuid("ID de dispositivo inválido."),
  location: z
    .string()
    .min(3, "La ubicación debe tener al menos 3 caracteres.")
    .max(100),
});

const DeviceConfigSchema = z.object({
  deviceId: z.string().uuid(),
  deviceType: z.enum(["refrigerator", "hvac"]),
  minTemp: z.coerce.number().optional().nullable(),
  maxTemp: z.coerce.number().optional().nullable(),
});

export interface DeviceFormState {
  message: string;
  type: "success" | "error";
}

export async function updateDeviceLocationAction(
  prevState: DeviceFormState,
  formData: FormData
): Promise<DeviceFormState> {
  const supabase = await createClient();

  // 1. SEGURIDAD REFORZADA: solo permitimos al 'super_admin'
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return {
      type: "error",
      message: "No autorizado para realizar esta acción.",
    };
  }

  // 2. Validar los datos del formulario
  const validatedFields = UpdateLocationSchema.safeParse({
    deviceId: formData.get("deviceId"),
    location: formData.get("location"),
  });

  if (!validatedFields.success) {
    return {
      type: "error",
      message:
        validatedFields.error.flatten().fieldErrors.location?.[0] ||
        "Entrada inválida.",
    };
  }

  const { deviceId, location } = validatedFields.data;

  //  Ejecutar la actualización
  const { error } = await supabase
    .from("devices")
    .update({ location: location })
    .eq("id", deviceId);

  if (error) {
    return {
      type: "error",
      message: `Error de base de datos: ${error.message}`,
    };
  }

  // Revalidar la ruta del dashboard del cliente para que vea el cambio
  const { data: deviceData } = await supabase
    .from("devices")
    .select("client_id")
    .eq("id", deviceId)
    .single();
  if (deviceData?.client_id) {
    revalidatePath(`/${deviceData.client_id}/admin/dashboard`);
  }
  revalidatePath("/2a/dashboard"); // También revalidamos el dashboard principal

  return { type: "success", message: "Ubicación actualizada." };
}

export async function updateDeviceConfigurationAction(
  prevState: DeviceFormState,
  formData: FormData
): Promise<DeviceFormState> {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return { type: "error", message: "No autorizado." };
  }

  // --- LÓGICA PARA PROCESAR EL FORMULARIO ---
  const rawFormData = Object.fromEntries(formData.entries());

  // 1. Validamos los campos principales
  const validatedFields = DeviceConfigSchema.safeParse({
    deviceId: rawFormData.deviceId,
    deviceType: rawFormData.deviceType,
    minTemp: rawFormData.minTemp || null,
    maxTemp: rawFormData.maxTemp || null,
  });

  if (!validatedFields.success) {
    return { type: "error", message: "Datos de formulario inválidos." };
  }

  // 2. Construimos la configuración de las sondas
  const probeConfigs: { id: string; name: string; alerts_enabled: boolean }[] =
    [];
  const probeKeys = Object.keys(rawFormData).filter((key) =>
    key.startsWith("probe_name_")
  );

  for (const key of probeKeys) {
    const index = key.split("_")[2];
    probeConfigs.push({
      id: `probe_${index}`,
      name: rawFormData[key] as string,
      // Si el checkbox está marcado, su valor es 'on'; si no, no existe en formData.
      alerts_enabled: rawFormData.hasOwnProperty(`probe_alerts_${index}`),
    });
  }

  const { deviceId, deviceType, minTemp, maxTemp } = validatedFields.data;

  const sensorConfig = { probes: probeConfigs }; // (Aquí podriamos añadir para corrientes también)

  // 3. Actualizamos la base de datos
  const { error } = await supabase
    .from("devices")
    .update({
      device_type: deviceType,
      min_temp_threshold: minTemp,
      max_temp_threshold: maxTemp,
      sensor_config: sensorConfig,
    })
    .eq("id", deviceId);

  if (error) {
    return {
      type: "error",
      message: `Error de base de datos: ${error.message}`,
    };
  }

  revalidatePath(`/devices/${deviceId}`);
  return { type: "success", message: "Configuración guardada con éxito." };
}
