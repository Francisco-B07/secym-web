import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Esquema de validación para los datos de entrada
const UserProfileSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["super_admin", "client_admin", "client_viewer"]),
  client_id: z.string().uuid().nullable(),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const userData = UserProfileSchema.parse(body);

    // Creamos un cliente de admin con la SERVICE_ROLE_KEY
    // Este cliente tiene permisos para hacer todo
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- PASO A: Crear el usuario en auth.users ---
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        app_metadata: {
          role: userData.role,
          client_id: userData.client_id,
        },
      });

    if (authError) {
      throw new Error(`Error de autenticación: ${authError.message}`);
    }

    const newUser = authData.user;

    // --- PASO B: Insertar el perfil en public.profiles ---
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.id,
        role: userData.role,
        client_id: userData.client_id,
      });

    if (profileError) {
      // Si falla la inserción del perfil, BORRAMOS el usuario que acabamos de crear
      // para no dejar datos huérfanos. Esto hace la operación "atómica".
      await supabaseAdmin.auth.admin.deleteUser(newUser.id);
      throw new Error(`Error de base de datos: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ user: newUser }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
