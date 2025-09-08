"use client";

import {
  createClientAction,
  type ClientFormState,
} from "@/actions/clientActions";
import { SubmitButton } from "./SubmitButton";
import { useEffect, useRef, useActionState } from "react";

const initialState: ClientFormState = { message: "", type: "success" };

export default function CreateClientForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const [state, formAction] = useActionState(createClientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.type === "success" && state.message) {
      formRef.current?.reset();
      if (onSuccess) onSuccess();
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Nombre del Cliente
        </label>
        <input
          id="name"
          name="name" // El 'name' debe coincidir con el que espera el FormData
          type="text"
          placeholder="Ej: Hospital Central de San Juan"
          required
          className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <SubmitButton loadingText="Creando...">Crear Cliente</SubmitButton>
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
