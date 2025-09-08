"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Esquema de validación para el formulario de usuario
const UserSchema = z
  .object({
    email: z.string().email({ message: "Email inválido." }),
    password: z
      .string()
      .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
    role: z.enum(["super_admin", "client_admin", "client_viewer"]),
    clientId: z.string().uuid().optional(), // El clientId es opcional
  })
  .refine(
    (data) => {
      // Si el rol no es super_admin, el clientId es obligatorio
      return data.role === "super_admin" || !!data.clientId;
    },
    {
      message: "Se requiere un cliente para los roles de cliente.",
      path: ["clientId"],
    }
  );

export interface UserFormState {
  message: string;
  type: "success" | "error";
}

export async function createUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  const supabase = await createClient();

  // 1. Validar sesión de super_admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return { type: "error", message: "No autorizado." };
  }

  // 2. Validar datos del formulario
  const validatedFields = UserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    clientId: formData.get("clientId") || undefined,
  });

  if (!validatedFields.success) {
    const firstError = Object.values(
      validatedFields.error.flatten().fieldErrors
    )[0]?.[0];
    return { type: "error", message: firstError || "Entrada inválida." };
  }

  const { email, password, role, clientId } = validatedFields.data;

  // 3. ¡EL CAMBIO! Llamar a nuestra nueva Edge Function
  const { error } = await supabase.functions.invoke("create-user-and-profile", {
    body: {
      email,
      password,
      role,
      client_id: role === "super_admin" ? null : clientId,
    },
  });

  if (error) {
    return {
      type: "error",
      message: `Error al crear usuario: ${error.message}`,
    };
  }

  // 4. Revalidar la ruta (podríamos tener una tabla de usuarios en el futuro)
  revalidatePath("/2a/dashboard");

  // 5. Devolver éxito
  return { type: "success", message: `Usuario ${email} creado con éxito.` };
}

// --- ACCIÓN PARA ACTUALIZAR UN USUARIO ---

const UpdateUserSchema = z
  .object({
    userId: z.string().uuid(),
    role: z.enum(["super_admin", "client_admin", "client_viewer"]),
    clientId: z.string().uuid().nullable(),
  })
  .refine(
    (data) =>
      data.role === "super_admin" ? data.clientId === null : !!data.clientId,
    {
      message: "Se requiere un cliente para los roles de cliente.",
      path: ["clientId"],
    }
  );

export async function updateUserAction(
  prevState: UserFormState,
  formData: FormData
): Promise<UserFormState> {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return { type: "error", message: "No autorizado." };
  }

  const validatedFields = UpdateUserSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    clientId: formData.get("clientId") || null,
  });

  if (!validatedFields.success) {
    return { type: "error", message: "Datos inválidos." };
  }

  const { userId, role, clientId } = validatedFields.data;
  const supabaseAdmin = await createSupabaseAdminClient();

  // Paso 1: Actualizar los metadatos en Supabase Auth
  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    {
      app_metadata: { role, client_id: clientId },
    }
  );

  if (authError) {
    return {
      type: "error",
      message: `Error al actualizar en Auth: ${authError.message}`,
    };
  }

  // Paso 2: Actualizar la tabla de perfiles para mantener la sincronización
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ role, client_id: clientId })
    .eq("id", userId);

  if (profileError) {
    return {
      type: "error",
      message: `Error al actualizar perfil: ${profileError.message}`,
    };
  }

  revalidatePath("/2a/dashboard");
  return { type: "success", message: "Usuario actualizado con éxito." };
}

// --- ACCIÓN PARA ELIMINAR UN USUARIO ---

export async function deleteUserAction(userId: string): Promise<UserFormState> {
  "use server";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.app_metadata.role !== "super_admin") {
    return { type: "error", message: "No autorizado." };
  }

  if (!userId) {
    return { type: "error", message: "ID de usuario no proporcionado." };
  }

  const supabaseAdmin = await createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) {
    return {
      type: "error",
      message: `Error al eliminar usuario: ${error.message}`,
    };
  }

  revalidatePath("/2a/dashboard");
  return { type: "success", message: "Usuario eliminado con éxito." };
}
