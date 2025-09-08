"use client";

import { useActionState } from "react";
import { useEffect, useState } from "react";
import Modal from "../shared/Modal";
import { SubmitButton } from "./SubmitButton";
import type { UserFormState } from "@/actions/userActions";
import type { User, Client } from "@/lib/types";

// Definimos los tipos para las props que esperamos
type Role = "super_admin" | "client_admin" | "client_viewer";
type UpdateUserAction = (
  prevState: UserFormState,
  formData: FormData
) => Promise<UserFormState>;

interface EditUserModalProps {
  user: User;
  clients: Client[];
  onClose: () => void;
  onSuccess: () => void;
  updateAction: UpdateUserAction;
  allowedRoles: readonly Role[];
}

const initialState: UserFormState = { message: "", type: "success" };

export default function EditUserModal({
  user,
  clients,
  onClose,
  onSuccess,
  updateAction,
  allowedRoles,
}: EditUserModalProps) {
  const [state, formAction] = useActionState(updateAction, initialState);
  const [selectedRole, setSelectedRole] = useState(user.role);

  useEffect(() => {
    if (state.type === "success" && state.message) {
      onSuccess();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  const roleDisplayNames: Record<Role, string> = {
    super_admin: "Super Administrador (2A)",
    client_admin: "Administrador de Cliente",
    client_viewer: "Visualizador de Cliente",
  };

  return (
    <Modal
      isOpen={!!user}
      onClose={onClose}
      title={`Editar Usuario: ${user.email}`}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="userId" value={user.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700">Rol</label>
          <select
            name="role"
            defaultValue={user.role}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full p-2 mt-1 border rounded-md bg-white"
          >
            {/* 4. Construimos el dropdown dinámicamente */}
            {allowedRoles.map((role) => (
              <option key={role} value={role}>
                {roleDisplayNames[role]}
              </option>
            ))}
          </select>
        </div>

        {selectedRole !== "super_admin" && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Cliente
            </label>
            <select
              name="clientId"
              defaultValue={user.clientId ?? undefined}
              className="w-full p-2 mt-1 border rounded-md bg-white"
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <SubmitButton loadingText="Guardando...">
            Guardar Cambios
          </SubmitButton>
        </div>
        {state.type === "error" && (
          <p className="mt-2 text-sm text-red-600">{state.message}</p>
        )}
      </form>
    </Modal>
  );
}
