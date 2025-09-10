"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BellIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { type Alert } from "@/lib/types";

export default function NotificationBell({ userId }: { userId: string }) {
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("alerts-channel")
      .on<Alert>(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          console.log("Nueva alerta recibida:", payload);
          // Mostramos una notificación toast
          toast.error(
            `Nueva Alerta: ${payload.new.alert_type}\n${payload.new.details}`,
            {
              duration: 6000,
            }
          );
          // Incrementamos el contador
          setNewAlertsCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <button className="relative p-2 text-gray-500 hover:text-gray-700">
      <BellIcon className="h-6 w-6" />
      {newAlertsCount > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
          {newAlertsCount}
        </span>
      )}
    </button>
  );
}
