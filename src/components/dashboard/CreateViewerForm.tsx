"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreateViewerForm({ clientId }: { clientId: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.functions.invoke("create-user", {
      body: {
        email,
        password,
        role: "client_viewer", // El rol está fijado
        client_id: clientId, // El client_id se pasa como prop
      },
    });

    if (error) {
      setMessage({ type: "error", text: `Error: ${error.message}` });
    } else {
      setMessage({
        type: "success",
        text: "Usuario visualizador creado con éxito.",
      });
      setEmail("");
      setPassword("");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email del Usuario
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 mt-1 border rounded-md"
          placeholder="operario@ejemplo.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contraseña Temporal
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 mt-1 border rounded-md"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 font-medium text-white bg-cyan-400 rounded-md hover:bg-cyan-500 disabled:opacity-50"
      >
        {loading ? "Creando..." : "Crear Visualizador"}
      </button>
      {message && (
        <p
          className={`mt-2 text-sm ${
            message.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  );
}
