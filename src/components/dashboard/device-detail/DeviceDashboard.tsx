"use client";

import { useState, useMemo } from "react";
import type { Device, SensorReading, Alert, ChartSeries } from "@/lib/types";
import TimeRangeFilter from "./TimeRangeFilter";
import TemperatureChart from "./TemperatureChart";
import CurrentChart from "./CurrentChart";
import AlertsTable from "./AlertsTable";

// Definimos la estructura de las props que este componente recibe
interface DeviceDashboardProps {
  device: Device;
  initialReadings: SensorReading[];
  hourlyCurrent: {
    hour: string;
    avg_current_a: number;
    avg_current_b: number;
  }[];
  alerts: Alert[];
}

export default function DeviceDashboard({
  initialReadings,
  hourlyCurrent,
  alerts,
}: DeviceDashboardProps) {
  // 1. ESTADO: Manejo de la visibilidad de las sondas
  // Obtenemos las claves de las sondas de la primera lectura (ej: ['probe_0', 'probe_1', ...])
  const probeKeys = useMemo(
    () =>
      initialReadings.length > 0 && initialReadings[0].probe_temperatures
        ? Object.keys(initialReadings[0].probe_temperatures)
        : [],
    [initialReadings]
  );

  // Creamos un estado para controlar qué sonda está visible en el gráfico
  const [visibleProbes, setVisibleProbes] = useState<Record<string, boolean>>(
    () => probeKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const handleProbeVisibilityChange = (probeKey: string) => {
    setVisibleProbes((prev) => ({ ...prev, [probeKey]: !prev[probeKey] }));
  };

  // 2. PROCESAMIENTO DE DATOS: Transformamos los datos para los gráficos

  // Datos para el gráfico de temperaturas, filtrados por visibilidad
  const temperatureSeries = useMemo<ChartSeries[]>(
    () =>
      probeKeys.map((key, index) => ({
        name: `Sonda ${index + 1}`,
        // Si la sonda no está visible, pasamos un array vacío al gráfico
        data: visibleProbes[key]
          ? initialReadings.map((r) => ({
              x: new Date(r.timestamp).getTime(),
              y: r.probe_temperatures?.[key] ?? null,
            }))
          : [],
      })),
    [initialReadings, probeKeys, visibleProbes]
  );

  // Datos para el gráfico de corriente
  const currentSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name: "Corriente A (Prom/h)",
        data: hourlyCurrent.map((d) => ({
          x: new Date(d.hour).getTime(),
          y: d.avg_current_a,
        })),
      },
      {
        name: "Corriente B (Prom/h)",
        data: hourlyCurrent.map((d) => ({
          x: new Date(d.hour).getTime(),
          y: d.avg_current_b,
        })),
      },
    ],
    [hourlyCurrent]
  );

  return (
    <div className="space-y-8">
      {/* SECCIÓN DE FILTROS */}
      <div className="flex justify-end">
        <TimeRangeFilter />
      </div>

      {/* SECCIÓN DE GRÁFICO DE TEMPERATURA */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Temperaturas de Sondas (Heladera Crítica)
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 pb-4 border-b">
          {probeKeys.map((key, index) => (
            <label
              key={key}
              className="inline-flex items-center cursor-pointer"
            >
              <input
                type="checkbox"
                checked={visibleProbes[key]}
                onChange={() => handleProbeVisibilityChange(key)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{`Sonda ${
                index + 1
              }`}</span>
            </label>
          ))}
        </div>
        <TemperatureChart
          seriesData={temperatureSeries}
          minThreshold={2}
          maxThreshold={8}
          isLoading={initialReadings.length === 0} // Estado de carga
        />
      </div>

      {/* SECCIÓN DE GRÁFICO DE CORRIENTE */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Consumo de Corriente (Promedio por Hora)
        </h2>
        <CurrentChart seriesData={currentSeries} />
      </div>

      {/* SECCIÓN DE HISTORIAL DE ALERTAS */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Historial de Alertas
        </h2>
        <AlertsTable alerts={alerts} />
      </div>
    </div>
  );
}
