"use client";
import { useFormStatus } from "react-dom";

interface SubmitButtonProps {
  loadingText: string;
  children: React.ReactNode;
}

export function SubmitButton({ loadingText, children }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-medium text-white bg-cyan-400 rounded-md hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? loadingText : children}
    </button>
  );
}
