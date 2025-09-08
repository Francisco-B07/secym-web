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
