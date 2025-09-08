import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function UsersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="font-bold text-xl text-cyan-600">
                Plataforma Industrial
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Hola, {session?.user?.email}
              </span>
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
