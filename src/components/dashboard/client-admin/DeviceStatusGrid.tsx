"use client";
import { DeviceWithStatus } from "@/lib/types";
import DeviceCard from "./DeviceCard";

//  Definimos una interfaz de Props más clara
interface DeviceStatusGridProps {
  devices: DeviceWithStatus[];
  userRole: string;
  onDataChange: () => void;
}

export default function DeviceStatusGrid({
  devices,
  userRole,
  onDataChange,
}: DeviceStatusGridProps) {
  if (devices.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900">
          No se encontraron equipos
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No hay dispositivos registrados para este cliente.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          userRole={userRole}
          onDataChange={onDataChange}
        />
      ))}
    </div>
  );
}
