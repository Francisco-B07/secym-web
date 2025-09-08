"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Definimos el esquema de validación con Zod
const ClientSchema = z.object({
  name: z
    .string()
    .min(1, { message: "El nombre debe tener al menos 1 caracter." }),
});

// Tipamos el estado que devolverá la acción para el hook useFormState
export interface ClientFormState {
  message: string;
  type: "success" | "error";
}

export async function createClientAction(
  prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const supabase = await createClient();

  // 1. Validar la sesión del usuario
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
  const validatedFields = ClientSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return {
      type: "error",
      message:
        validatedFields.error.flatten().fieldErrors.name?.[0] ||
        "Entrada inválida.",
    };
  }

  // 3. Ejecutar la lógica de negocio (insertar en la base de datos)
  const { error } = await supabase
    .from("clients")
    .insert({ name: validatedFields.data.name });

  if (error) {
    return {
      type: "error",
      message: `Error de base de datos: ${error.message}`,
    };
  }

  // 4. Revalidar la ruta para que la UI se actualice con la nueva lista de clientes
  revalidatePath("/2a/dashboard");

  // 5. Devolver un estado de éxito
  return {
    type: "success",
    message: `Cliente "${validatedFields.data.name}" creado con éxito.`,
  };
}

// --- ACCIÓN PARA ACTUALIZAR UN CLIENTE ---

export interface ClientFormState {
  message: string;
  type: "success" | "error";
}

const UpdateClientSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(1, { message: "El nombre debe tener al menos 1 caracter." }),
});

export async function updateClientAction(
  prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return { type: "error", message: "No autorizado." };
  }

  const validatedFields = UpdateClientSchema.safeParse({
    id: formData.get("clientId"),
    name: formData.get("name"),
  });

  if (!validatedFields.success) {
    return { type: "error", message: "Datos inválidos." };
  }

  const { id, name } = validatedFields.data;
  const { error } = await supabase
    .from("clients")
    .update({ name })
    .eq("id", id);

  if (error) {
    return {
      type: "error",
      message: `Error de base de datos: ${error.message}`,
    };
  }

  revalidatePath("/2a/dashboard");
  return { type: "success", message: "Cliente actualizado con éxito." };
}
