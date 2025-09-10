import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import logo from "/public/logo-2a.jpg";
import NotificationBell from "@/components/shared/NotificationBell";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src={logo} // Ruta de la imagen en la carpeta 'public'
                  alt="Logo de 2A"
                  width={1050}
                  height={600}
                  priority // Añadir 'priority' le dice a Next.js que cargue el logo rápidamente
                  className="h-auto w-24 mr-2 flex align-bottom " // Usar h-auto y w-auto para mantener la proporción
                />
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Hola {user?.email}</span>
              <NotificationBell userId={user!.id} />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
