"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MetricCard from "./MetricCard";

// Importa todos los iconos que vayas a necesitar
import {
  BoltIcon,
  FireIcon,
  BeakerIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

// Mapeamos el nombre de la métrica al componente del icono
const iconMap = {
  Temperatura: FireIcon,
  Corriente: BoltIcon,
  Presión: BeakerIcon,
  Vibración: ArrowsRightLeftIcon,
};

// Definimos el tipo para una única métrica
export interface Metric {
  id: string;
  title: string;
  value: string;
  unit: string;
  status: "normal" | "warning" | "danger";
}

interface RealtimeMetricsGridProps {
  initialMetrics: Metric[];
  clientId: string;
}

export default function RealtimeMetricsGrid({
  initialMetrics,
  clientId,
}: RealtimeMetricsGridProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const supabase = createClient();

  useEffect(() => {
    // Escuchamos cambios en una tabla (ej. 'sensor_data') para este cliente específico
    const channel = supabase
      .channel(`realtime-metrics:${clientId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Escuchar INSERT, UPDATE, DELETE
          schema: "public",
          table: "sensor_data", // ¡Necesitarás crear esta tabla en Supabase!
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log("¡Nuevo dato recibido!", payload);
          // Aquí iría tu lógica para actualizar el estado `metrics`
          // Por ejemplo, buscar el `id` de la métrica en `payload.new` y actualizar su valor.
          // setMetrics(currentMetrics => ...actualizar y devolver nuevo array...);
        }
      )
      .subscribe();

    // Función de limpieza para desuscribirse cuando el componente se desmonte
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, clientId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          unit={metric.unit}
          status={metric.status}
          Icon={iconMap[metric.title as keyof typeof iconMap] || BeakerIcon}
        />
      ))}
    </div>
  );
}
