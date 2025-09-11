"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import {
  PlusIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type { ClientWithStatus, User, Alert, Kpis } from "@/lib/types";

// Importa todos los componentes y acciones
import UsersTable from "@/components/dashboard/UsersTable";
import CreateUserModal from "@/components/dashboard/CreateUserModal";
import ClientList from "@/components/dashboard/ClientList";
import CreateClientModal from "@/components/dashboard/CreateClientModal";
import StatCard from "@/components/dashboard/StatCard";
import AlertsFeed from "@/components/dashboard/AlertsFeed";
import Tabs from "@/components/dashboard/shared/Tabs";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/actions/userActions";

interface DashboardData {
  clients: ClientWithStatus[];
  users: User[];
  kpis: Kpis;
  alerts: Alert[];
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => {
    if (!res.ok) {
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
      <p className="text-gray-500 animate-pulse">
        Cargando Centro de Operaciones...
      </p>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [isCreateUserModalOpen, setCreateUserModalOpen] = useState(false);
  const [isCreateClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // NOTA: Asegúrate de que la ruta de tu API sea la correcta, sin /v1/.
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    "/api/v1/dashboard-data",
    fetcher
  );

  const handleDataChange = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleTabChange = () => {
    setSearchTerm("");
  };

  // Filtramos los datos de forma optimizada
  const filteredClients = useMemo(
    () =>
      data?.clients.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
    [data?.clients, searchTerm]
  );
  const filteredUsers = useMemo(
    () =>
      data?.users.filter((u) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
    [data?.users, searchTerm]
  );

  if (isLoading) return <LoadingSkeleton />;
  if (error)
    return (
      <div className="text-center py-20 text-red-600">
        Error: {error.message}
      </div>
    );

  const kpis = data!.kpis;
  const superAdminAllowedRoles = [
    "super_admin",
    "client_admin",
    "client_viewer",
  ] as const;

  const tabs = [
    {
      name: "Vista General",
      content: (
        <div className="flex justify-center gap-8">
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Clientes Activos"
                value={kpis.total_clients}
                Icon={BuildingOffice2Icon}
                colorClass="text-blue-500"
              />
              <StatCard
                title="Equipos OK"
                value={kpis.ok_devices}
                Icon={CheckCircleIcon}
                colorClass="text-green-500"
              />
              <StatCard
                title="Advertencias"
                value={kpis.warning_devices}
                Icon={ExclamationTriangleIcon}
                colorClass="text-yellow-500"
              />
              <StatCard
                title="Equipos Críticos"
                value={kpis.critical_devices + kpis.offline_devices}
                Icon={ExclamationTriangleIcon}
                colorClass="text-red-500"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-cyan-600/40 min-h-40">
              <h3 className="font-semibold text-2xl text-gray-800 mb-6 text-center">
                Alertas Recientes
              </h3>
              <AlertsFeed alerts={data!.alerts} />
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Gestión de Clientes",
      content: (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Buscar cliente por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-md w-1/2"
            />
            <button
              onClick={() => setCreateClientModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" /> Crear Cliente
            </button>
          </div>
          <ClientList
            clients={filteredClients}
            onDataChange={handleDataChange}
          />
        </div>
      ),
    },
    {
      name: "Gestión de Usuarios",
      content: (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Buscar usuario por email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-2 border rounded-md w-1/2"
            />
            <button
              onClick={() => setCreateUserModalOpen(true)}
              className="inline-flex items-center gap-x-2 rounded-md bg-cyan-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500"
            >
              <PlusIcon className="-ml-0.5 h-5 w-5" /> Crear Usuario
            </button>
          </div>
          <UsersTable
            users={filteredUsers}
            clients={data!.clients}
            onDataChange={handleDataChange}
            updateAction={updateUserAction}
            deleteAction={deleteUserAction}
            allowedRoles={superAdminAllowedRoles}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold text-gray-900 text-center py-4">
          Centro de Operaciones - 2A
        </h1>
      </header>
      {/* Pasamos el manejador de cambio de pestaña a nuestro componente Tabs */}
      <Tabs tabs={tabs} onTabChange={handleTabChange} />

      {/* Modales */}
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
