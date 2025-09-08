"use client";

import { UserFormState } from "@/actions/userActions";
import Modal from "../shared/Modal";
import CreateUserForm from "./CreateUserForm";

type Client = { id: string; name: string; created_at: string };
type Role = "super_admin" | "client_admin" | "client_viewer";
type CreateUserAction = (
  prevState: UserFormState,
  formData: FormData
) => Promise<UserFormState>;

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  onSuccess?: () => void;
  createAction: CreateUserAction;
  allowedRoles: readonly Role[];
}

export default function CreateUserModal({
  isOpen,
  onClose,
  clients,
  onSuccess,
  createAction,
  allowedRoles,
}: CreateUserModalProps) {
  const handleSuccess = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Usuario">
      <CreateUserForm
        clients={clients}
        onSuccess={handleSuccess}
        createAction={createAction}
        allowedRoles={allowedRoles}
      />
    </Modal>
  );
}
