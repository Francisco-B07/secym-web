"use client";

import { useState, useMemo } from "react";
import type { Device, SensorReading, Alert, ChartSeries } from "@/lib/types";
import TimeRangeFilter from "./TimeRangeFilter";
import TemperatureChart from "./TemperatureChart";
import CurrentChart from "./CurrentChart";
import AlertsTable from "./AlertsTable";
import DeviceSettings from "./DeviceSettings";
import AmbientChart from "./AmbientChart";
import Tabs from "@/components/dashboard/shared/Tabs";
import { Switch } from "@headlessui/react";

interface DeviceDashboardProps {
  device: Device & {
    sensor_config?: {
      probes?: { id: string; name: string; alerts_enabled: boolean }[];
      currents?: { id: string; name: string }[];
    };
    min_temp_threshold?: number | null;
    max_temp_threshold?: number | null;
    device_type?: string;
  };
  initialReadings: SensorReading[];
  hourlyCurrent: {
    hour: string;
    avg_current_a: number | null;
    avg_current_b: number | null;
  }[];
  alerts: Alert[];
  userRole: string;
}

export default function DeviceDashboard({
  device,
  initialReadings,
  hourlyCurrent,
  alerts,
  userRole,
}: DeviceDashboardProps) {
  const [chartType, setChartType] = useState<"line" | "scatter">("scatter");

  const probeKeys = useMemo(
    () =>
      initialReadings.length > 0 &&
      Array.isArray(initialReadings[0].probe_temperatures)
        ? Object.keys(initialReadings[0].probe_temperatures)
        : [],
    [initialReadings]
  );

  const probeCount =
    probeKeys.length > 0
      ? probeKeys.length
      : device.sensor_config?.probes?.length || 0;

  const [visibleProbes, setVisibleProbes] = useState<Record<string, boolean>>(
    () => probeKeys.reduce((acc, key) => ({ ...acc, [key]: true }), {})
  );

  const handleProbeVisibilityChange = (probeKey: string) => {
    setVisibleProbes((prev) => ({ ...prev, [probeKey]: !prev[probeKey] }));
  };

  const temperatureSeries = useMemo<ChartSeries[]>(
    () =>
      probeKeys.map((key, index) => {
        const probeConfig = device.sensor_config?.probes?.find(
          (p) => p.id === `probe_${index}`
        );
        const probeName = probeConfig?.name || `Sonda ${index + 1}`;
        return {
          name: probeName,
          data: visibleProbes[key]
            ? initialReadings.map((r) => ({
                x: new Date(r.timestamp).getTime(),
                y: r.probe_temperatures?.[parseInt(key)] ?? null,
              }))
            : [],
        };
      }),
    [initialReadings, probeKeys, visibleProbes, device.sensor_config]
  );

  const currentSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name:
          device.sensor_config?.currents?.find((c) => c.id === "current_a")
            ?.name || "Corriente A (Prom/h)",
        data: hourlyCurrent.map((d) => ({
          x: new Date(d.hour).getTime(),
          y: d.avg_current_a,
        })),
      },
      {
        name:
          device.sensor_config?.currents?.find((c) => c.id === "current_b")
            ?.name || "Corriente B (Prom/h)",
        data: hourlyCurrent.map((d) => ({
          x: new Date(d.hour).getTime(),
          y: d.avg_current_b,
        })),
      },
    ],
    [hourlyCurrent, device.sensor_config]
  );

  const ambientSeries = useMemo<ChartSeries[]>(
    () => [
      {
        name: "Temperatura",
        data: initialReadings.map((r) => ({
          x: new Date(r.timestamp).getTime(),
          y: r.ambient_temp,
        })),
      },
      {
        name: "Humedad",
        data: initialReadings.map((r) => ({
          x: new Date(r.timestamp).getTime(),
          y: r.ambient_hum,
        })),
      },
    ],
    [initialReadings]
  );

  const tabs = [
    {
      name: "Monitoreo en Vivo",
      content: (
        <div className="space-y-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Temperaturas de Sondas (
                {device.device_type === "refrigerator" ? "Heladera" : "HVAC"})
              </h2>
              {userRole === "super_admin" && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 p-1 rounded-full">
                  <span>Puntos</span>
                  <Switch
                    checked={chartType === "line"}
                    onChange={() =>
                      setChartType(chartType === "line" ? "scatter" : "line")
                    }
                    className={`${
                      chartType === "line" ? "bg-indigo-600" : "bg-gray-300"
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
                  >
                    <span
                      className={`${
                        chartType === "line" ? "translate-x-6" : "translate-x-1"
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                  <span>Líneas</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 pb-4 border-b">
              {probeKeys.length > 0 ? (
                probeKeys.map((key, index) => (
                  <label
                    key={key}
                    className="inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!visibleProbes[key]}
                      onChange={() => handleProbeVisibilityChange(key)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {device.sensor_config?.probes?.[index]?.name ||
                        `Sonda ${index + 1}`}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  No hay datos de sondas para mostrar.
                </p>
              )}
            </div>
            <TemperatureChart
              seriesData={temperatureSeries}
              minThreshold={device.min_temp_threshold ?? 2}
              maxThreshold={device.max_temp_threshold ?? 8}
              type={chartType}
              isLoading={!initialReadings}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Condiciones Ambientales (DHT11)
              </h2>
              <AmbientChart
                seriesData={ambientSeries}
                isLoading={!initialReadings}
              />
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Consumo de Corriente (Promedio por Hora)
              </h2>
              <CurrentChart
                seriesData={currentSeries}
                isLoading={!hourlyCurrent}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Historial de Alertas",
      content: <AlertsTable alerts={alerts} />,
    },
  ];

  if (userRole === "super_admin") {
    tabs.push({
      name: "Configuración",
      content: <DeviceSettings device={device} probeCount={probeCount} />,
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            {device.location}
          </h1>
          <p className="text-gray-600 mt-1">Nodo ID: {device.node_id}</p>
        </header>
        <TimeRangeFilter />
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
