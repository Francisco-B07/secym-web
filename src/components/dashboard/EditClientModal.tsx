"use client";
import {
  updateClientAction,
  type ClientFormState,
} from "@/actions/clientActions";
import { SubmitButton } from "./SubmitButton";
import { useEffect, useActionState } from "react";
import Modal from "../shared/Modal";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client: { id: string; name: string };
}

const initialState: ClientFormState = { message: "", type: "success" };

export default function EditClientModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: EditModalProps) {
  const [state, formAction] = useActionState<ClientFormState, FormData>(
    updateClientAction,
    initialState
  );

  useEffect(() => {
    if (state.type === "success" && state.message) {
      onSuccess();
      onClose();
    }
  }, [state, onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar Cliente: ${client.name}`}
    >
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="clientId" value={client.id} />
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Nuevo Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={client.name}
            required
            className="w-full px-3 py-2 mt-1 border rounded-md"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose}>
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
