"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import UsersTable from "@/components/dashboard/UsersTable";
import CreateUserModal from "@/components/dashboard/CreateUserModal";
import { PlusIcon } from "@heroicons/react/24/solid";
import ClientList from "@/components/dashboard/ClientList";
import CreateClientModal from "@/components/dashboard/CreateClientModal";
import type { ClientWithStatus, User } from "@/lib/types";

// --- 1. IMPORTAMOS LAS ACCIONES ESPECÍFICAS DEL SUPER ADMIN ---
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/actions/userActions";

interface DashboardData {
  clients: ClientWithStatus[];
  users: User[];
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) {
      // Mejoramos el manejo de errores para obtener más detalles
      return res.json().then((body) => {
        const error = new Error(
          body.error || "Hubo un problema al cargar los datos."
        );
        throw error;
      });
    }
    return res.json();
  });

function LoadingSkeleton() {
  return (
    <div className="text-center py-20">
      <p className="text-gray-500 animate-pulse">Cargando datos del panel...</p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [isCreateClientModalOpen, setCreateClientModalOpen] = useState(false);

  // NOTA: Asegúrate que la ruta de tu API sea la correcta. La creamos en `app/api/v1/dashboard-data/route.ts`
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/v1/dashboard-data",
    fetcher
  );

  const handleDataChange = useCallback(() => {
    mutate();
  }, [mutate]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        Error: {error.message}
      </div>
    );
  }

  // 2. Definimos los roles que un super_admin puede crear/editar
  const superAdminAllowedRoles = [
    "super_admin",
    "client_admin",
    "client_viewer",
  ] as const;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-gray-900 text-center py-4">
          Panel de Super Administrador
        </h1>
      </header>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col lg:flex-row w-full gap-10 p-6">
        {/* Columna Izquierda: Clientes */}
        <div className="w-full lg:w-1/2 p-4 lg:border-r lg:border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Gestión de Clientes
            </h2>
            <button
              onClick={() => setCreateClientModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Crear Cliente
            </button>
          </div>
          <ClientList clients={data!.clients} onDataChange={handleDataChange} />
        </div>
        {/* Columna Derecha: Usuarios */}
        <div className="w-full lg:w-1/2 p-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              Gestión de Usuarios
            </h2>
            <button
              onClick={() => setCreateUserModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" />
              Crear Usuario
            </button>
          </div>
          {/* 3. Pasamos las props requeridas a UsersTable */}
          <UsersTable
            users={data!.users}
            clients={data!.clients}
            onDataChange={handleDataChange}
            updateAction={updateUserAction}
            deleteAction={deleteUserAction}
            allowedRoles={superAdminAllowedRoles}
          />
        </div>
      </div>

      {/* 4. Pasamos las props requeridas a CreateUserModal */}
      <CreateUserModal
        isOpen={isCreateUserModalOpen}
        onClose={() => setCreateUserModalOpen(false)}
        clients={data!.clients}
        onSuccess={handleDataChange}
        createAction={createUserAction}
        allowedRoles={superAdminAllowedRoles}
      />
      <CreateClientModal
        isOpen={isCreateClientModalOpen}
        onClose={() => setCreateClientModalOpen(false)}
        onSuccess={handleDataChange}
      />
    </div>
  );
}
