"use client";

import { useState } from "react";
import Link from "next/link";
import EditClientModal from "./EditClientModal";
import type { ClientWithStatus } from "@/lib/types";

interface ClientListProps {
  clients: ClientWithStatus[];
  onDataChange: () => void;
}

export default function ClientList({ clients, onDataChange }: ClientListProps) {
  const [editingClient, setEditingClient] = useState<ClientWithStatus | null>(
    null
  );

  return (
    <div className="mt-6">
      <h3 className="font-medium text-gray-700">Clientes Actuales</h3>
      <ul role="list" className="divide-y divide-gray-200 mt-2">
        {clients.map((client) => (
          <li
            key={client.id}
            className="p-4 flex items-center justify-between hover:bg-gray-50"
          >
            <Link href={`/${client.id}/admin/dashboard`} className="flex-grow">
              <p className="text-lg font-medium text-cyan-600 truncate">
                {client.name}
              </p>
              {/* ... tu JSX para los contadores de estado ... */}
            </Link>
            <div className="ml-4 flex-shrink-0 space-x-3">
              <button
                onClick={() => setEditingClient(client)}
                className="text-cyan-600 hover:text-cyan-900 text-sm"
              >
                Editar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {editingClient && (
        <EditClientModal
          isOpen={!!editingClient}
          onClose={() => setEditingClient(null)}
          onSuccess={onDataChange}
          client={editingClient}
        />
      )}
    </div>
  );
}
