"use client";

import { type UserFormState } from "@/actions/userActions";
import { SubmitButton } from "./SubmitButton";
import { useEffect, useRef, useState, useActionState } from "react";

type Client = { id: string; name: string };
type Role = "super_admin" | "client_admin" | "client_viewer";

// Definimos un tipo para la Server Action que esperamos
type CreateUserAction = (
  prevState: UserFormState,
  formData: FormData
) => Promise<UserFormState>;

interface CreateUserFormProps {
  clients: Client[];
  onSuccess?: () => void;
  createAction: CreateUserAction;
  allowedRoles: readonly Role[];
}

const initialState: UserFormState = { message: "", type: "success" };

export default function CreateUserForm({
  clients,
  onSuccess,
  createAction,
  allowedRoles,
}: CreateUserFormProps) {
  const [state, formAction] = useActionState(createAction, initialState);
  const [selectedRole, setSelectedRole] = useState<Role>(allowedRoles[0]);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.type === "success" && state.message) {
      formRef.current?.reset();
      setSelectedRole(allowedRoles[0]);
      if (onSuccess) onSuccess();
    }
  }, [state, onSuccess, allowedRoles]);

  const roleDisplayNames: Record<Role, string> = {
    super_admin: "Super Administrador (2A)",
    client_admin: "Administrador de Cliente",
    client_viewer: "Visualizador de Cliente",
  };
  useEffect(() => {
    if (state.type === "success" && state.message) {
      formRef.current?.reset();
      setSelectedRole("client_viewer");
      if (onSuccess) onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 p-4 border rounded-lg bg-gray-50"
    >
      <h3 className="text-lg font-medium text-gray-900">Crear Nuevo Usuario</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full p-2 mt-1 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          className="w-full p-2 mt-1 border rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Rol</label>
        <select
          name="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as Role)}
          className="w-full p-2 mt-1 border rounded-md bg-white"
        >
          {/* Renderizamos los roles permitidos dinámicamente */}
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
            Asignar a Cliente
          </label>
          <select
            name="clientId"
            defaultValue={clients[0]?.id}
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

      <SubmitButton loadingText="Creando...">Crear Usuario</SubmitButton>
      {state.message && (
        <p
          className={`mt-2 text-sm ${
            state.type === "error" ? "text-red-600" : "text-green-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
