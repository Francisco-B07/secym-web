"use client";

import Modal from "../shared/Modal";
import CreateClientForm from "./CreateClientForm";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClientModalProps) {
  // Creamos un manejador que refresca los datos Y cierra el modal
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess(); // Llama a la función de refresco (mutate de SWR)
    }
    onClose(); // Cierra el modal
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Cliente">
      <CreateClientForm onSuccess={handleSuccess} />
    </Modal>
  );
}
