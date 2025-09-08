import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.23.8/mod.ts";

// Headers CORS para permitir que tu aplicación frontend llame a esta función.
// Es una buena práctica usar una variable de entorno para el origen en producción.
const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ORIGIN") ?? "*", // O tu URL de producción
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Esquema de validación con Zod para el cuerpo de la solicitud.
// Asegura que los datos entrantes tengan la forma y el tipo correctos.
const UserSchema = z.object({
  email: z.string().email({ message: "El formato del email no es válido." }),
  password: z
    .string()
    .min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  role: z.enum(["client_admin", "client_viewer"]),
  client_id: z
    .string()
    .uuid({ message: "El ID del cliente debe ser un UUID válido." }),
});

serve(async (req: Request): Promise<Response> => {
  // Manejo de la solicitud pre-vuelo (preflight) del navegador para CORS.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Autorización: verificar quién está creando el usuario.
    // Se crea un cliente con el token de autorización del usuario que realiza la llamada.
    const supabaseAuthClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Obtenemos los datos del usuario que invoca la función.
    const {
      data: { user: invoker },
    } = await supabaseAuthClient.auth.getUser();

    if (!invoker) {
      return new Response(
        JSON.stringify({
          error: "No autenticado. Se requiere un token válido.",
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const invokerRole = invoker.app_metadata.role;
    const invokerClientId = invoker.app_metadata.client_id;

    // 2. Validación de entrada
    const body = await req.json();
    const validation = UserSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Datos de entrada inválidos.",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 422, // Unprocessable Entity: El formato es correcto pero los datos no.
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const { email, password, role, client_id } = validation.data;

    // 3. Lógica de Permisos de Negocio
    if (invokerRole === "super_admin") {
      // El super_admin puede crear cualquier rol ('client_admin', 'client_viewer') para cualquier cliente.
      // No se necesitan más validaciones aquí.
    } else if (invokerRole === "client_admin") {
      // Un client_admin solo puede crear usuarios client_viewer.
      if (role !== "client_viewer") {
        return new Response(
          JSON.stringify({
            error:
              "Permiso denegado. Solo puedes crear usuarios de tipo 'visualizador'.",
          }),
          { status: 403, headers: corsHeaders }
        );
      }
      // Y solo puede hacerlo dentro de su propio cliente.
      if (client_id !== invokerClientId) {
        return new Response(
          JSON.stringify({
            error:
              "Permiso denegado. No puedes crear usuarios para otro cliente.",
          }),
          { status: 403, headers: corsHeaders }
        );
      }
    } else {
      // Ningún otro rol (ej. client_viewer) puede crear usuarios.
      return new Response(
        JSON.stringify({ error: "No autorizado para realizar esta acción." }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 4. Creación del usuario
    // Se utiliza un cliente de servicio (service_role_key) para eludir las políticas de RLS
    // y poder crear usuarios administrativamente.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Importante: requiere que el usuario confirme su email.
      app_metadata: { role, client_id },
    });

    if (error) throw error; // Lanza el error para que sea capturado por el bloque catch.

    // 5. Respuesta de Éxito
    return new Response(JSON.stringify(data.user), {
      status: 201, // Created
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error); // Siempre es bueno registrar el error en los logs de la función.

    // Verificamos si el error es una instancia de la clase Error estándar.
    if (error instanceof Error) {
      // Ahora TypeScript sabe que `error` tiene una propiedad `message`.
      if (error.message.includes("User already registered")) {
        return new Response(
          JSON.stringify({ error: "Este email ya está en uso." }),
          { status: 409, headers: corsHeaders } // Conflict
        );
      }
      // Devolvemos un mensaje de error específico y útil.
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback para errores que no son instancias de Error.
    return new Response(
      JSON.stringify({ error: "Ocurrió un error inesperado." }),
      {
        status: 500, // Internal Server Error
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
