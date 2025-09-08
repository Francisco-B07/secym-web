"use client";

import { useState } from "react";
import EditUserModal from "./EditUserModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { UserFormState } from "@/actions/userActions";
import { Client, User } from "@/lib/types";

// Definimos los tipos para las Server Actions
type UpdateUserAction = (
  prevState: UserFormState,
  formData: FormData
) => Promise<UserFormState>;
type DeleteUserAction = (userId: string) => Promise<UserFormState>;
type Role = "super_admin" | "client_admin" | "client_viewer";

interface UsersTableProps {
  users: User[];
  clients: Client[];
  onDataChange: () => void;
  updateAction: UpdateUserAction;
  deleteAction: DeleteUserAction;
  allowedRoles: readonly Role[];
}

export default function UsersTable({
  users,
  clients,
  onDataChange,
  updateAction,
  deleteAction,
  allowedRoles,
}: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  return (
    <div className="mt-6">
      <h3 className="font-medium text-gray-700">Usuarios Existentes</h3>
      <div className="mt-2 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Rol
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Cliente
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.role}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {user.role === "super_admin" ? "N/A" : user.clientName}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="text-cyan-600 hover:text-cyan-900"
                      >
                        Editar
                      </button>
                      <span className="mx-2 text-gray-300">|</span>
                      {/* El botón de eliminar solo abre el modal de confirmación */}
                      <button
                        onClick={() => setDeletingUser(user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {editingUser && (
        <EditUserModal
          user={editingUser}
          clients={clients}
          onClose={() => setEditingUser(null)}
          onSuccess={onDataChange}
          updateAction={updateAction}
          allowedRoles={allowedRoles}
        />
      )}
      {deletingUser && (
        <DeleteConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          onSuccess={onDataChange}
          user={deletingUser}
          deleteAction={deleteAction}
        />
      )}
    </div>
  );
}
