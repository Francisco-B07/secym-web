"use client";

import { useTransition } from "react";
import Modal from "../shared/Modal";
import type { UserFormState } from "@/actions/userActions";
import type { User } from "@/lib/types";

// Definimos el tipo para la Server Action que esperamos
type DeleteUserAction = (userId: string) => Promise<UserFormState>;

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User;
  deleteAction: DeleteUserAction; // <-- 1. Aceptamos la acción como prop
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onSuccess,
  user,
  deleteAction,
}: DeleteConfirmationModalProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      // 2. Usamos la acción de la prop en lugar de una importada
      const result = await deleteAction(user.id);
      if (result?.type === "error") {
        alert(`Error: ${result.message}`);
      } else {
        onSuccess();
      }
      onClose();
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirmar Eliminación">
      <div className="space-y-4">
        <p className="text-gray-600">
          ¿Estás seguro de que quieres eliminar al usuario{" "}
          <span className="font-semibold">{user.email}</span>?
        </p>
        <p className="text-sm font-bold text-red-700">
          Esta acción es irreversible.
        </p>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? "Eliminando..." : "Sí, Eliminar"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
