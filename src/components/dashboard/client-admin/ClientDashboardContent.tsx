"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { type User, type DeviceWithStatus } from "@/lib/types";
import Tabs from "@/components/dashboard/shared/Tabs";
import DeviceStatusGrid from "@/components/dashboard/client-admin/DeviceStatusGrid";
import UserManagementPanel from "@/components/dashboard/client-admin/UserManagementPanel";

// Un fetcher más robusto que extrae el mensaje de error del cuerpo del JSON
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorBody = await res
      .json()
      .catch(() => ({ error: "Error de red inesperado" }));
    const error = new Error(
      errorBody.error || "Ocurrió un error al cargar los datos."
    );
    throw error;
  }
  return res.json();
};

function LoadingState() {
  return (
    <div className="text-center py-10 text-gray-500">Cargando equipos...</div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-10 text-red-600 bg-red-50 rounded-lg">
      Error: {message}
    </div>
  );
}

interface ClientDashboardContentProps {
  clientId: string;
  clientName: string;
  initialDevices: DeviceWithStatus[];
  initialUsers: User[];
  userRole: string;
}

export default function ClientDashboardContent({
  clientId,
  clientName,
  initialDevices,
  initialUsers,
  userRole,
}: ClientDashboardContentProps) {
  // SWR para los dispositivos
  const {
    data: devices,
    error: devicesError,
    isLoading: devicesLoading,
    mutate: mutateDevices,
  } = useSWR<DeviceWithStatus[]>(
    `/api/v1/clients/${clientId}/devices`,
    fetcher,
    {
      fallbackData: initialDevices,
      revalidateOnFocus: true, // Mantiene los datos frescos
    }
  );

  const handleDataChange = useCallback(() => {
    mutateDevices();
  }, [mutateDevices]);

  // Preparamos el contenido de la pestaña de monitoreo, manejando todos los estados
  let deviceContent;
  if (devicesLoading && !devices) {
    deviceContent = <LoadingState />;
  } else if (devicesError) {
    deviceContent = <ErrorState message={devicesError.message} />;
  } else {
    deviceContent = (
      <DeviceStatusGrid
        devices={devices || []}
        userRole={userRole}
        onDataChange={handleDataChange}
      />
    );
  }

  const tabs = [
    { name: "Monitoreo de Equipos", content: deviceContent },
    {
      name: "Gestión de Usuarios",
      content: (
        <UserManagementPanel
          clientId={clientId}
          initialUsers={initialUsers}
          clientName={clientName}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-900">
          Panel de Administración: {clientName}
        </h1>
        <p className="text-gray-600 mt-1">
          Supervise sus equipos y gestione el acceso de su personal.
        </p>
      </header>
      <Tabs tabs={tabs} />
    </div>
  );
}
