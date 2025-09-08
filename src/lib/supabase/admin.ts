import { createClient } from "@supabase/supabase-js";

// Obtenemos las variables de entorno. El '!' asegura a TypeScript que no serán nulas.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Creamos y exportamos un cliente Supabase que usa la SERVICE_ROLE_KEY.
// Este cliente tiene permisos de super-administrador.
export const createSupabaseAdminClient = () => {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
