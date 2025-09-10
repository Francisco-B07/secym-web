"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ClockIcon } from "@heroicons/react/24/outline";

interface TimeAgoProps {
  timestamp: string | null | undefined;
}

export default function TimeAgo({ timestamp }: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState("N/A");

  useEffect(() => {
    // Este código solo se ejecuta en el navegador, nunca durante el renderizado del servidor.
    if (timestamp) {
      const formattedTime = formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es,
      });
      setTimeAgo(formattedTime);
    }
  }, [timestamp]); // Se recalcula si el timestamp cambia

  return (
    <div className="flex items-center">
      <ClockIcon className="h-4 w-4 mr-1" />
      <span>Actualizado: {timeAgo}</span>
    </div>
  );
}
