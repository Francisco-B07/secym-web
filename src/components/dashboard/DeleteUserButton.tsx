"use client";

import { useTransition } from "react";
import { deleteUserAction } from "@/actions/userActions";

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      window.confirm(
        "¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible."
      )
    ) {
      startTransition(async () => {
        const result = await deleteUserAction(userId);
        if (result?.type === "error") {
          alert(result.message);
        } else {
          // El revalidatePath en la acción se encargará de refrescar la lista
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-red-600 hover:text-red-900 disabled:opacity-50"
    >
      {isPending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
