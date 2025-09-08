"use server";

import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import z from "zod";

export interface ClientUserFormState {
  message: string;
  type: "success" | "error";
}

const CreateClientUserSchema = z.object({
  email: z.string().email({ message: "Debe ser un email válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  role: z.enum(["client_admin", "client_viewer"], {
    message: "El rol seleccionado no es válido.",
  }),
});

// Acción para que un client_admin cree usuarios en su propio cliente
export async function createClientUserAction(
  prevState: ClientUserFormState,
  formData: FormData
): Promise<ClientUserFormState> {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  if (
    !adminUser ||
    adminUser.app_metadata.role !== "client_admin" ||
    !adminUser.app_metadata.client_id
  ) {
    return { type: "error", message: "No autorizado." };
  }

  // 1. Validar los datos del formulario con Zod
  const validatedFields = CreateClientUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    const firstError = Object.values(
      validatedFields.error.flatten().fieldErrors
    )[0]?.[0];
    return { type: "error", message: firstError || "Entrada inválida." };
  }

  //  `role` tiene el tipo correcto: 'client_admin' | 'client_viewer'
  const { email, password, role } = validatedFields.data;
  const clientId = adminUser.app_metadata.client_id;

  const supabaseAdmin = createSupabaseAdminClient();

  // Capturamos `newUser` directamente de la respuesta de `createUser`
  const {
    data: { user: newUser },
    error: authError,
  } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: {
      role,
      client_id: clientId,
    },
  });

  if (authError) {
    return {
      type: "error",
      message: `Error al crear usuario: ${authError.message}`,
    };
  }
  if (!newUser) {
    return { type: "error", message: "El usuario no pudo ser creado." };
  }

  //Sincronizar el perfil usando el `newUser.id` que acabamos de obtener
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: newUser.id,
    role: role,
    client_id: clientId,
  });

  if (profileError) {
    // Si falla la inserción del perfil, borramos el usuario de auth para no dejar datos huérfanos
    await supabaseAdmin.auth.admin.deleteUser(newUser.id);
    return {
      type: "error",
      message: `Error de base de datos al crear perfil: ${profileError.message}`,
    };
  }

  revalidatePath(`/${clientId}/admin/dashboard`);
  return { type: "success", message: `Usuario ${email} creado con éxito.` };
}

export async function updateClientUserAction(
  prevState: ClientUserFormState,
  formData: FormData
): Promise<ClientUserFormState> {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // 1. Seguridad: Verificar que el invocador es un client_admin
  if (
    !adminUser ||
    adminUser.app_metadata.role !== "client_admin" ||
    !adminUser.app_metadata.client_id
  ) {
    return { type: "error", message: "No autorizado." };
  }

  const adminClientId = adminUser.app_metadata.client_id;
  const userIdToUpdate = formData.get("userId") as string;
  const newRole = formData.get("role") as string;

  // 2. Seguridad: Un client_admin solo puede asignar roles de cliente
  if (newRole !== "client_admin" && newRole !== "client_viewer") {
    return { type: "error", message: "Rol no permitido." };
  }

  const supabaseAdmin = createSupabaseAdminClient();

  // 3. Seguridad: Verificar que el usuario a editar pertenece al mismo cliente
  const { data: userToUpdate, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("client_id")
    .eq("id", userIdToUpdate)
    .single();
  if (fetchError || userToUpdate?.client_id !== adminClientId) {
    return {
      type: "error",
      message: "No tienes permiso para editar este usuario.",
    };
  }

  // 4. Actualizar Auth y Perfil
  await Promise.all([
    supabaseAdmin.auth.admin.updateUserById(userIdToUpdate, {
      app_metadata: { role: newRole, client_id: adminClientId },
    }),
    supabaseAdmin
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userIdToUpdate),
  ]);

  revalidatePath(`/${adminClientId}/admin/dashboard`);
  return { type: "success", message: "Usuario actualizado." };
}

// --- ACCIÓN PARA ELIMINAR USUARIOS ---
export async function deleteClientUserAction(
  userIdToDelete: string
): Promise<ClientUserFormState> {
  const supabase = await createClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();

  // 1. Seguridad: Verificar que el invocador es un client_admin
  if (
    !adminUser ||
    adminUser.app_metadata.role !== "client_admin" ||
    !adminUser.app_metadata.client_id
  ) {
    return { type: "error", message: "No autorizado." };
  }
  const adminClientId = adminUser.app_metadata.client_id;
  const supabaseAdmin = createSupabaseAdminClient();

  // 2. Seguridad: Verificar que el usuario a eliminar pertenece al mismo cliente
  const { data: userToDelete, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("client_id")
    .eq("id", userIdToDelete)
    .single();
  if (fetchError || userToDelete?.client_id !== adminClientId) {
    return {
      type: "error",
      message: "No tienes permiso para eliminar este usuario.",
    };
  }

  // 3. Eliminar el usuario
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userIdToDelete
  );
  if (deleteError) {
    return { type: "error", message: deleteError.message };
  }

  revalidatePath(`/${adminClientId}/admin/dashboard`);
  return { type: "success", message: "Usuario eliminado." };
}
