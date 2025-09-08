"use client";
import { DeviceWithStatus } from "@/lib/types";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import StatusIndicator from "@/components/shared/StatusIndicator";
import ProbeTemperatures from "@/components/dashboard/shared/ProbeTemperatures";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DeviceFormState,
  updateDeviceLocationAction,
} from "@/actions/deviceActions";
import { useState, useEffect } from "react";
import { useActionState } from "react";

const initialState: DeviceFormState = { message: "", type: "success" };

export default function DeviceCard({
  device,
  userRole,
  onDataChange,
}: {
  device: DeviceWithStatus;
  userRole: string;
  onDataChange?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, formAction] = useActionState(
    updateDeviceLocationAction,
    initialState
  );

  // Usamos useEffect para manejar los efectos secundarios después de que la acción se complete.
  useEffect(() => {
    // Si la acción fue exitosa y hay un mensaje...
    if (state.type === "success" && state.message) {
      setIsEditing(false); // Salimos del modo de edición
      if (onDataChange) {
        onDataChange(); // Pedimos al dashboard que refresque los datos
      }
    }
  }, [state, onDataChange]); // Este efecto se ejecuta solo cuando 'state' u 'onDataChange' cambian

  const totalCurrent =
    (device.latest_reading?.current_a ?? 0) +
    (device.latest_reading?.current_b ?? 0);
  const lastUpdate = device.latest_reading?.timestamp
    ? formatDistanceToNow(new Date(device.latest_reading.timestamp), {
        addSuffix: true,
        locale: es,
      })
    : "N/A";

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex flex-col justify-between transition-all duration-300">
      <div>
        <div className="flex justify-between items-start mb-2">
          {isEditing && userRole === "super_admin" ? (
            // --- 1. EL FORMULARIO DE EDICIÓN EN LÍNEA ---
            <form action={formAction} className="w-full">
              <input type="hidden" name="deviceId" value={device.id} />
              <input
                type="text"
                name="location"
                defaultValue={device.location}
                className="text-lg font-bold text-gray-800 border-b-2 border--500 focus:outline-none w-full bg-cyan-50"
                autoFocus
              />
              <div className="flex justify-end space-x-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                {/* Usamos un SubmitButton genérico para el estado de carga */}
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                >
                  Guardar
                </button>
              </div>
              {state.type === "error" && (
                <p className="text-xs text-red-500 mt-1">{state.message}</p>
              )}
            </form>
          ) : (
            <div className="flex items-center group">
              <h3 className="font-bold text-lg text-gray-800">
                {device.location}
              </h3>
              {userRole === "super_admin" && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
          <StatusIndicator status={device.status} />
        </div>
        {!isEditing && (
          <p className="text-xs text-gray-500 mb-4">Nodo: {device.node_id}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-500">T° Ambiente</p>
            <p className="text-2xl font-bold text-cyan-600">
              {device.latest_reading?.ambient_temp?.toFixed(1) ?? "N/A"} °C
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Corriente Total</p>
            <p className="text-2xl font-bold text-cyan-600">
              {totalCurrent.toFixed(1)} A
            </p>
          </div>
        </div>

        <ProbeTemperatures
          temperatures={
            device.latest_reading?.probe_temperatures as number[] | null
          }
        />
      </div>

      <div className="mt-4 border-t border-gray-200 pt-3 flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span>Actualizado: {lastUpdate}</span>
        </div>
        <Link
          href={`/devices/${device.id}`}
          className="inline-flex items-center font-semibold text-cyan-600 hover:text-cyan-800"
        >
          Ver Detalles
          <ArrowTopRightOnSquareIcon className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
}
