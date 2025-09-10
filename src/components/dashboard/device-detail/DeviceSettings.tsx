"use client";

import { useActionState, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { type Device } from "@/lib/types";
import {
  updateDeviceConfigurationAction,
  type DeviceFormState,
} from "@/actions/deviceActions";
import { SubmitButton } from "../SubmitButton";

const initialState: DeviceFormState = { message: "", type: "success" };

interface DeviceSettingsProps {
  device: Device & {
    device_type?: "refrigerator" | "hvac";
    min_temp_threshold?: number | null;
    max_temp_threshold?: number | null;
  };
  probeCount: number;
}

export default function DeviceSettings({
  device,
  probeCount,
}: DeviceSettingsProps) {
  const [state, formAction] = useActionState(
    updateDeviceConfigurationAction,
    initialState
  );

  const [deviceType, setDeviceType] = useState<"refrigerator" | "hvac">(
    device.device_type || "hvac"
  );

  useEffect(() => {
    if (state.message) {
      if (state.type === "success") toast.success(state.message);
      else if (state.type === "error") toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6 max-w-2xl p-4 bg-gray-50 rounded-lg border"
    >
      <input type="hidden" name="deviceId" value={device.id} />

      {/* SECCIÓN TIPO DE EQUIPO Y UMBRALES */}
      <div>
        <label
          htmlFor="deviceType"
          className="block text-sm font-medium text-gray-700"
        >
          Tipo de Equipo
        </label>
        <select
          id="deviceType"
          name="deviceType"
          value={deviceType}
          onChange={(e) =>
            setDeviceType(e.target.value as "refrigerator" | "hvac")
          }
          className="mt-1 block w-full rounded-full border border-gray-200 px-3 py-1 shadow-sm"
        >
          <option value="hvac">Climatización (HVAC)</option>
          <option value="refrigerator">Heladera Crítica</option>
        </select>
      </div>

      {deviceType === "refrigerator" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minTemp" className="block text-sm font-medium">
              Umbral Mínimo T° (°C)
            </label>
            <input
              type="number"
              step="0.1"
              name="minTemp"
              id="minTemp"
              defaultValue={device.min_temp_threshold ?? ""}
              className="mt-1 block w-full  rounded-full border border-gray-200 px-3 py-1"
            />
          </div>
          <div>
            <label htmlFor="maxTemp" className="block text-sm font-medium">
              Umbral Máximo T° (°C)
            </label>
            <input
              type="number"
              step="0.1"
              name="maxTemp"
              id="maxTemp"
              defaultValue={device.max_temp_threshold ?? ""}
              className="mt-1 block w-full rounded-full border border-gray-200 px-3 py-1"
            />
          </div>
        </div>
      )}

      {/* SECCIÓN NOMBRES DE SENSORES */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-base font-semibold leading-7 text-gray-900">
          Configuración de Sondas
        </h3>
        <div className="mt-4 space-y-4">
          {Array.from({ length: probeCount }).map((_, index) => {
            const probeConfig = device.sensor_config?.probes?.[index];
            return (
              <div
                key={index}
                className="p-3 border rounded-md bg-white grid grid-cols-1 md:grid-cols-3 gap-3 items-center"
              >
                <label
                  htmlFor={`probe_name_${index}`}
                  className="md:col-span-2"
                >
                  <span className="text-sm font-medium text-gray-800">
                    Nombre Sonda {index + 1}
                  </span>
                  <input
                    type="text"
                    id={`probe_name_${index}`}
                    name={`probe_name_${index}`}
                    defaultValue={probeConfig?.name || `Sonda ${index + 1}`}
                    className="mt-1 block w-full rounded-full border border-gray-200 px-3 py-1"
                    placeholder="Ej: Entrada de Evaporador"
                  />
                </label>
                <div className="flex items-center justify-self-start md:justify-self-center">
                  <input
                    type="checkbox"
                    id={`probe_alerts_${index}`}
                    name={`probe_alerts_${index}`}
                    defaultChecked={probeConfig?.alerts_enabled ?? true}
                    className="h-5 w-5 rounded-full border border-gray-200 px-3 py-1 text-cyan-600 focus:ring-cyan-500"
                  />
                  <label
                    htmlFor={`probe_alerts_${index}`}
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    Habilitar Alertas
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4">
        <SubmitButton loadingText="Guardando...">
          Guardar Configuración
        </SubmitButton>
      </div>
    </form>
  );
}
