"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { PlusIcon } from "@heroicons/react/24/solid";
import type { User } from "@/lib/types";
import UsersTable from "@/components/dashboard/UsersTable";
import CreateUserModal from "@/components/dashboard/CreateUserModal";
import {
  createClientUserAction,
  deleteClientUserAction,
  updateClientUserAction,
} from "@/actions/clientAdminActions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserManagementPanel({
  clientId,
  initialUsers,
  clientName,
}: {
  clientId: string;
  initialUsers: User[];
  clientName: string;
}) {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);

  // Usamos SWR para mantener la lista de usuarios actualizada
  const { data: users, mutate } = useSWR(
    `/api/v1/clients/${clientId}/users`,
    fetcher,
    {
      fallbackData: initialUsers,
    }
  );

  const handleDataChange = useCallback(() => {
    mutate(); // Refrescar la lista de usuarios
  }, [mutate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">
          Personal de {clientName}
        </h3>
        <button
          onClick={() => setCreateUserModalOpen(true)}
          className="inline-flex items-center gap-x-2 rounded-md bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" />
          Añadir Usuario
        </button>
      </div>

      <UsersTable
        users={users || []}
        clients={[{ id: clientId, name: clientName, created_at: "" }]} // Pasamos solo el cliente actual
        onDataChange={handleDataChange}
        // Pasamos las acciones específicas del client_admin
        updateAction={updateClientUserAction}
        deleteAction={deleteClientUserAction}
        allowedRoles={["client_admin", "client_viewer"]} // Limitamos los roles que se pueden crear/editar
      />

      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        clients={[{ id: clientId, name: clientName, created_at: "" }]} // Solo puede asignar a su propio cliente
        onSuccess={handleDataChange}
        createAction={createClientUserAction} // Pasamos la acción de creación específica
        allowedRoles={["client_admin", "client_viewer"]}
      />
    </div>
  );
}
